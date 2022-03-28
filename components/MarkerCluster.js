import React, {Component} from 'react';
import {Dimensions} from 'react-native';
import PropTypes from 'prop-types';
import Supercluster from 'supercluster';
import ClusterMarker from './ClusterMarker';

const {width} = Dimensions.get('window');
const DEFAULT_CLUSTER_COLOR = '#F44336';
const DEFAULT_FONT_COLOR = '#FFFFFF';
const DEFAULT_MIN_CLUSTER_SIZE = 28;
const DEFAULT_MAX_CLUSTER_SIZE = 44;
const DEFAULT_CLUSTER_FONT_FAMILY = undefined;

class MarkerCluster extends Component {
  rawData = [];
  constructor(props) {
    super(props);
    this.state = {
      clusterMarkers: [],
      superCluster: null,
      childrenMarkers: [],
    };
    this.maxZoom = this.props.maxZoom;
    this.minZoom = this.props.minZoom;
    this.minPoints = this.props.minPoints;
    this.extent = this.props.extent;
    this.nodeSize = this.props.nodeSize;
    this.radius = this.props.radius;
  }

  componentDidMount() {
    if (this.props?.region) {
      this.updateClusters(this.props.region);
    }
  }

  componentDidUpdate() {
    console.log('updated');
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (this.props.region !== nextProps.region) {
      this.updateClusters(nextProps.region);
      // it was false
      return true;
    }

    return true;
  }

  render() {
    if (!this.props.clusterEnabled) {
      return (
        <React.Fragment>
          {React.Children.toArray(this.props?.children).map(children => {
            return children;
          })}
        </React.Fragment>
      );
    }
    return (
      <React.Fragment>
        {this.state.clusterMarkers.map((marker, index) => {
          const coordinate = {
            latitude: marker.geometry.coordinates[1],
            longitude: marker.geometry.coordinates[0],
          };

          let zoom = this.props.maxZoom + 1.1;
          const markerId = marker?.id;

          if (markerId) {
            const expansionZoom =
              this.state.superCluster.getClusterExpansionZoom(markerId);

            if (zoom > expansionZoom) {
              zoom = expansionZoom + 0.5;
            }
          }
          return marker.properties.point_count <= this.props.minPoints - 1 ? (
            this.state.childrenMarkers[marker.properties.index]
          ) : (
            <ClusterMarker
              fontFamily={this.props.clusterFontFamily}
              minClusterSize={this.props.minClusterSize}
              maxClusterSize={this.props.maxClusterSize}
              isBold={this.props.isBold}
              tracksViewChanges={this.props.tracksViewChanges}
              minClusterFontSize={this.props.minClusterFontSize}
              maxClusterFontSize={this.props.maxClusterFontSize}
              fontColor={
                this.props?.clusterFontColor
                  ? this.props.clusterFontColor
                  : DEFAULT_FONT_COLOR
              }
              color={
                this.props?.clusterColor
                  ? this.props.clusterColor
                  : DEFAULT_CLUSTER_COLOR
              }
              onPress={() => {
                const onClusterPress = this.props?.onClusterPress;

                if (onClusterPress) {
                  onClusterPress(marker);
                }

                if (!this.props.zoomEnabled) {
                  return;
                }

                const camera = {
                  center: coordinate,
                  pitch: 0,
                  heading: 0,
                  altitude: 0,
                  zoom: zoom,
                };

                this.props?.map &&
                  this.props.map.animateCamera(camera, {
                    duration: this.props.cameraAnimationDuration,
                  });
              }}
              key={index}
              numberOfPoints={marker.properties.point_count}
              coordinate={coordinate}
            />
          );
        })}
      </React.Fragment>
    );
  }

  updateClusters(region) {
    const children = this.props?.children;

    const zoom = Math.floor(this.calculateZoom(region));

    if (!children || !region) {
      this.setState({
        clusterMarkers: [],
        superCluster: null,
        childrenMarkers: [],
      });
      return;
    }

    if (zoom < this.minZoom) {
      this.setState({
        clusterMarkers: [],
        superCluster: null,
        childrenMarkers: [],
      });
      return;
    }

    const childrenMarkers = React.Children.toArray(children);

    this.rawData = [];

    try {
      childrenMarkers.forEach((child, index) => {
        this.rawData.push(this.markerToGeoJSONFeature(child, index));
      });
    } catch (e) {
      this.setState({
        clusterMarkers: [],
        superCluster: null,
        childrenMarkers: [],
      });
      console.warn(
        'MarkerCluster accepts only Marker children. Please remove other children which is not a Marker',
      );
      return;
    }

    const superCluster = new Supercluster({
      radius: this.radius,
      maxZoom: this.maxZoom,
      minZoom: this.minZoom,
      minPoints: this.minPoints,
      extent: this.extent,
      nodeSize: this.nodeSize,
    });

    superCluster.load(this.rawData);

    const envelope = this.envelopeFromRegion(region);

    const bBox = [envelope.xmin, envelope.ymin, envelope.xmax, envelope.ymax];

    const clusterMarkers = superCluster.getClusters(bBox, zoom);

    this.setState({
      clusterMarkers: clusterMarkers,
      superCluster: superCluster,
      childrenMarkers: childrenMarkers,
    });
  }

  calculateZoom = region => {
    return Math.log2(360 * (width / 256 / region.longitudeDelta));
  };

  markerToGeoJSONFeature = (marker, index) => {
    return {
      type: 'Feature',
      geometry: {
        coordinates: [
          marker.props?.coordinate.longitude,
          marker.props?.coordinate.latitude,
        ],
        type: 'Point',
      },
      properties: {
        point_count: 0,
        index,
        ...this.removeChildrenFromProps(marker.props),
      },
    };
  };

  removeChildrenFromProps = props => {
    const newProps = {};
    Object.keys(props).forEach(key => {
      if (key !== 'children') {
        newProps[key] = props[key];
      }
    });
    return newProps;
  };

  envelopeFromRegion = (region, scale = 1) => {
    const latOffset = (region.latitudeDelta / 2) * scale;
    const lngD =
      region.longitudeDelta < -180
        ? 360 + region.longitudeDelta
        : region.longitudeDelta;
    const lngOffset = (lngD / 2) * scale;

    return {
      xmin: this.calcMinLngByOffset(region.longitude, lngOffset),
      ymin: this.calcMinLatByOffset(region.latitude, latOffset),
      xmax: this.calcMaxLngByOffset(region.longitude, lngOffset),
      ymax: this.calcMaxLatByOffset(region.latitude, latOffset),
      spatialReference: {
        wkid: 4326,
        latestWkid: 4326,
      },
    };
  };

  calcMinLatByOffset = (lng, offset) => {
    const factValue = lng - offset;
    if (factValue < -90) {
      return (90 + offset) * -1;
    }
    return factValue;
  };

  calcMaxLatByOffset = (lng, offset) => {
    const factValue = lng + offset;
    if (factValue > 90) {
      return (90 - offset) * -1;
    }
    return factValue;
  };

  calcMinLngByOffset = (lng, offset) => {
    const factValue = lng - offset;
    if (factValue < -180) {
      return (180 + offset) * -1;
    }
    return factValue;
  };

  calcMaxLngByOffset = (lng, offset) => {
    const factValue = lng + offset;
    if (factValue > 180) {
      return (180 - offset) * -1;
    }
    return factValue;
  };
}

MarkerCluster.propTypes = {
  zoomEnabled: PropTypes.bool,
  tracksViewChanges: PropTypes.bool,
  minZoom: PropTypes.number,
  maxZoom: PropTypes.number,
  region: PropTypes.object.isRequired,
  cameraAnimationDuration: PropTypes.number,
  clusterColor: PropTypes.string,
  clusterFontColor: PropTypes.string,
  minClusterSize: PropTypes.number,
  maxClusterSize: PropTypes.number,
  minPoints: PropTypes.number,
  radius: PropTypes.number,
  extent: PropTypes.number,
  nodeSize: PropTypes.number,
  clusterFontFamily: PropTypes.string,
  isBold: PropTypes.bool,
  clusterEnabled: PropTypes.bool,
  minClusterFontSize: PropTypes.number,
  maxClusterFontSize: PropTypes.number,
};

MarkerCluster.defaultProps = {
  zoomEnabled: false,
  tracksViewChanges: false,
  minZoom: 0,
  maxZoom: 19,
  cameraAnimationDuration: 1000,
  clusterColor: DEFAULT_CLUSTER_COLOR,
  clusterFontColor: DEFAULT_FONT_COLOR,
  minClusterSize: DEFAULT_MIN_CLUSTER_SIZE,
  maxClusterSize: DEFAULT_MAX_CLUSTER_SIZE,
  minPoints: 2,
  radius: width * 0.12,
  extent: 512,
  nodeSize: 64,
  clusterFontFamily: DEFAULT_CLUSTER_FONT_FAMILY,
  isBold: false,
  clusterEnabled: true,
  minClusterFontSize: undefined,
  maxClusterFontSize: undefined,
};

export default MarkerCluster;

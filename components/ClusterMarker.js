import React, {Component} from 'react';
import {Text, View, StyleSheet} from 'react-native';
import {Marker} from 'react-native-maps';
import PropTypes from 'prop-types';
import hexToRgba from 'hex-to-rgba';

const EXTERIOR_CIRCLE_WIDTH_OFFSET = 10;
const EXTERIOR_CIRCLE_HEIGHT_OFFSET = 10;
const EXTERIOR_CIRCLE_RADIUS_OFFSET = 5;
const DEFAULT_CLUSTER_COLOR = '#F44336';
const DEFAULT_FONT_COLOR = '#FFFFFF';
const DEFAULT_CLUSTER_FONTSIZE = 14;
const DEFAULT_FONT_WEIGHT = 'normal';

class ClusterMarker extends Component {
  constructor(props) {
    super(props);
    this.color = this.props?.color ? this.props.color : DEFAULT_CLUSTER_COLOR;
    this.minClusterSize = this.props.minClusterSize;
    this.maxClusterSize = this.props.maxClusterSize;
    this.tracksViewChanges = this.props.tracksViewChanges;
    this.clusterTextStyle = this.props.clusterTextStyle;
    this.fontSize = this.clusterTextStyle?.fontSize
      ? this.clusterTextStyle.fontSize
      : DEFAULT_CLUSTER_FONTSIZE;
    this.fontColor = this.clusterTextStyle?.fontColor
      ? this.clusterTextStyle.fontColor
      : DEFAULT_FONT_COLOR;
    this.fontWeight = this.clusterTextStyle?.fontWeight
      ? this.clusterTextStyle.fontWeight
      : DEFAULT_FONT_WEIGHT;
    this.fontFamily = this.clusterTextStyle?.fontFamily
      ? this.clusterTextStyle.fontFamily
      : null;
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      this.props.coordinate.latitude !== nextProps.coordinate.latitude ||
      this.props.coordinate.longitude !== nextProps.coordinate.longitude ||
      this.props.numberOfPoints !== nextProps.numberOfPoints ||
      this.props?.color !== nextProps?.color ||
      this.props?.minClusterSize !== nextProps?.minClusterSize ||
      this.props?.maxClusterSize !== nextProps?.maxClusterSize ||
      this.props?.tracksViewChanges !== nextProps?.tracksViewChanges
    );
  }

  componentDidMount() {
    if (!this.props?.coordinate) {
      throw new Error(
        'Coordinate is missing for Cluster Marker.Please give a coordinate in LatLon object type',
      );
    }
  }

  render() {
    const points = this.props?.numberOfPoints ? this.props.numberOfPoints : 2;
    const {width, height, fontSize, borderRadius, fontColor} =
      returnMarkerStyle(
        points,
        this.fontColor,
        this.minClusterSize,
        this.maxClusterSize,
        this.fontSize,
      );

    return (
      <Marker
        coordinate={this.props.coordinate}
        anchor={{x: 0.5, y: 0.5}}
        zIndex={1001}
        tracksViewChanges={this.props.tracksViewChanges}
        onPress={() => {
          const onPress = this.props?.onPress;
          if (onPress) {
            onPress();
          }
        }}>
        <View
          style={[
            styles(this.color).container,
            {
              width: width + EXTERIOR_CIRCLE_WIDTH_OFFSET,
              height: height + EXTERIOR_CIRCLE_HEIGHT_OFFSET,
              borderRadius: borderRadius + EXTERIOR_CIRCLE_RADIUS_OFFSET,
            },
          ]}>
          <View
            style={[
              styles(this.color).contentContainer,
              {width: width, height: height, borderRadius: borderRadius},
            ]}>
            <Text
              style={{
                fontSize: fontSize,
                color: fontColor,
                fontFamily: this.fontFamily,
                fontWeight: this.fontWeight ? this.fontWeight : 'normal',
              }}>
              {this.props.numberOfPoints}
            </Text>
          </View>
        </View>
      </Marker>
    );
  }
}

const styles = clusterColor =>
  StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: hexToRgba(clusterColor, '0.4'),
    },

    contentContainer: {
      backgroundColor: clusterColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

const returnMarkerStyle = (points, fontColor, minSize, maxSize, fontSize) => {
  const clusterFontsize =
    fontSize && fontSize > 0 && !isNaN(fontSize)
      ? fontSize
      : DEFAULT_CLUSTER_FONTSIZE;
  console.log(fontSize);
  if (points > 999) {
    return {
      width: maxSize,
      height: maxSize,
      borderRadius: maxSize / 2,
      fontSize: clusterFontsize,
      fontColor: fontColor,
    };
  } else if (points > 15) {
    return {
      width: minSize * 1.3,
      height: minSize * 1.3,
      borderRadius: (minSize * 1.3) / 2,
      fontSize: clusterFontsize * 1.3,
      fontColor: fontColor,
    };
  } else if (points > 10) {
    return {
      width: minSize * 1.15,
      height: minSize * 1.15,
      borderRadius: (minSize * 1.15) / 2,
      fontSize: clusterFontsize * 1.15,
      fontColor: fontColor,
    };
  } else if (points >= 2) {
    return {
      width: minSize,
      height: minSize,
      borderRadius: minSize / 2,
      fontSize: clusterFontsize,
      fontColor: fontColor,
    };
  }
};

ClusterMarker.propTypes = {
  numberOfPoints: PropTypes.number,
  coordinate: PropTypes.shape({
    latitude: PropTypes.number,
    longitude: PropTypes.number,
  }).isRequired,
};

ClusterMarker.defaultProps = {
  numberOfPoints: 2,
};

export default ClusterMarker;

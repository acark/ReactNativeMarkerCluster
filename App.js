import React, {Component} from 'react';
import {View, StyleSheet} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import MarkerCluster from './components/MarkerCluster';

getRandomLatitude = (min = 48, max = 56) => {
  return Math.random() * (max - min) + min;
};

getRandomLongitude = (min = 14, max = 24) => {
  return Math.random() * (max - min) + min;
};

generateMarkers = count => {
  const markers = [];

  for (let i = 0; i < count; i++) {
    markers.push(
      <Marker
        anchor={{x: 0.5, y: 0.5}}
        tracksViewChanges={false}
        key={i}
        coordinate={{
          latitude: getRandomLatitude(),
          longitude: getRandomLongitude(),
        }}
      />,
    );
  }

  return markers;
};

const INITIAL_REGION = {
  latitude: 52.5,
  longitude: 19.2,
  latitudeDelta: 8.5,
  longitudeDelta: 8.5,
};

export class App extends Component {
  constructor(props) {
    super(props);
    this.markers = generateMarkers(100);
    this.state = {
      region: INITIAL_REGION,
    };
  }

  render() {
    return (
      <View style={styles.container}>
        <MapView // react-native-maps
          ref={ref => (this.map = ref)}
          moveOnMarkerPress={false}
          provider={PROVIDER_GOOGLE} // remove if not using Google Maps
          style={styles.map}
          onRegionChangeComplete={newRegion => {
            this.setState({region: newRegion});
          }}
          initialRegion={INITIAL_REGION}>
          <MarkerCluster
            isBold={false}
            region={this.state.region}
            tracksViewChanges={false}
            onClusterPress={marker => {
              console.log(marker);
            }}
            clusterTextStyle={{
              fontSize: 28,
              fontWeight: 'bold',
              fontFamily: 'Gwendolyn-Bold',
            }}
            renderMarker={() => {
              return (
                <Marker
                  tracksViewChanges={false}
                  anchor={{x: 0.5, y: 0.5}}
                  zIndex={1001}>
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      backgroundColor: 'blue',
                    }}></View>
                </Marker>
              );
            }}
            clusterEnabled={true}
            extent={512}
            nodeSize={64}
            zoomEnabled={true}
            minClusterSize={40}
            maxClusterSize={44}
            minPoints={2}
            cameraAnimationDuration={1000}
            map={this.map}>
            {this.markers.map(marker => {
              return marker;
            })}
          </MarkerCluster>
        </MapView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },

  map: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
});

export default App;

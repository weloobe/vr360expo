import React from 'react'
import {
  AppRegistry,
  asset,
  Pano,
  Text,
  View,
  VrButton
} from 'react-vr'

import axios from 'axios'

const FLICKR_API_BASE_URL = 'https://api.flickr.com/services/rest/'
const FLICKR_API_KEY = 'bd7f6d3c737cbede4347ab7e434bb71b'

export default class vrpanoexpo extends React.Component {
  constructor() {
    super()

    this.state = {
      buttonColor: 'rgba(10, 10, 10, 0.7)',
      isIntroVisible: true,
      currentPanoSource: asset('chess-world.jpg')
    }
    this._panoGallery = null
    this._cachedPanoSources = []
  }

  _fetchPanoImages = async () => {
    try {
      let reqParams = {
        method: "flickr.photos.search",
        api_key: FLICKR_API_KEY,
        tags: "equirectangular, equirectangle",
        accuracy: 1,
        content_type: 1,
        per_page: 500,
        format: "json",
        nojsoncallback: 1
      }
      let response = await axios.get(FLICKR_API_BASE_URL, {
          params: reqParams
      })

      if (response.data.stat === "ok") {
        if (response.data.photos.total >= 1) {
          /* There can be large result with more than one page.
           * To offert large exploration, a result page can be randomly target.
           * This to avoid having same pictures each time from first result page.
           * for pages >= 3, last page can have less result, so it will not be considered.
           */
          let luckyPage = 1
          let photoPages = response.data.photos.pages
          if (photoPages >= 3 && (luckyPage = Math.floor(Math.random() * photoPages - 1)) !== 1) {
            reqParams.page = luckyPage
            response = await axios.get(FLICKR_API_BASE_URL, {
                params: reqParams
            })
          }
          this._panoGallery = response.data.photos
        } else {
          console.warn('FlickrAPI:search: Humm, empty data fetched!')
        }
      } else {
        console.error('FlickrAPI:search: Oops, request error! ', response.data.message)
      }
      console.log(response.data)
    } catch (err) {
      console.error('FlickrAPI:search: Oops, connexion error! ', err)
    }
  }

  _fetchRandomPanoImageURI = async () => {
    let panoGallery = this._panoGallery

    if (panoGallery) {
      let luckyPic = Math.floor(Math.random() * panoGallery.photo.length);
      let catchedPanoSource = this._cachedPanoSources.find((source) => source.index === luckyPic)
      
      if (!catchedPanoSource) {
        let luckyPicInfo = panoGallery.photo[luckyPic];
          try {
            let response = await axios.get(FLICKR_API_BASE_URL, {
              params: {
                method: "flickr.photos.getSizes",
                api_key: FLICKR_API_KEY,
                photo_id: luckyPicInfo.id,
                format: "json",
                nojsoncallback: 1
              }
            })

            if (response.data.stat === "ok") {
              let luckyPicSizes = response.data.sizes
              // get largest image's size (can be very big for some and then timemore loading)
              // That said `three.js` seems to resize automatically big image (width > 8192px)
              let luckyPicLink = luckyPicSizes.size[luckyPicSizes.size.length - 1].source
              this.setState({ currentPanoSource: { uri: luckyPicLink } })
              this._cachedPanoSources.push({ index: luckyPic, uri: luckyPicLink })
            } else {
              console.error('FlickrAPI:getSizes: Oops, request error! ', response.data.message)
            }
            console.log(response.data)
          } catch (err) {
            console.error('FlickrAPI:getSizes: Oops, connexion error! ', err)
          }
        }
      } else {
        this.setState({ currentPanoSource: { uri: catchedPanoSource.uri } })
      }
  }

  _displayNewPano = () => { 
    this._fetchRandomPanoImageURI();
    this.setState({ buttonColor: '#009038' });
    if (this.state.isIntroVisible) this.setState({ isIntroVisible: false });
  }

  componentWillMount() {
    this._fetchPanoImages()
  }

  render() {
    return (
      <View>
        <Pano source={this.state.currentPanoSource}/>
        <View
          style={{
            backgroundColor: '#777879',
            layoutOrigin: [0.5, 0.5],
            paddingLeft: 0.2,
            paddingRight: 0.2,
            display: this.state.isIntroVisible ? 'flex': 'none',
            flex: 1,
            flexDirection: 'column',
            // width: 2,
            alignItems: 'stretch',
            transform: [{ translate: [0, 0, -3.5] }],
          }}>
          <Text style={{
            fontSize: 0.3,
            fontWeight: '400',
            textAlign: 'center',
            textAlignVertical: 'center',
          }}>
            welcome to vr-pano-expo
          </Text> 
          <Text style={{
            fontSize: 0.2,
            textAlign: 'center',
            textAlignVertical: 'center',
          }}>
            &gt; explore panoramic pictures in virtual reality mode !
          </Text> 
        </View>
        <View>
          <VrButton
            style={{ 
              width: 0.2,
              height: 0.2,
              backgroundColor: this.state.buttonColor,
              borderRadius: 0.5,
              borderColor: 'rgba(255, 255, 255, 0.9)',
              borderWidth: 0.03,
              layoutOrigin: [0.5, 0.5],
              transform: [{ translate: [0, 0, -2] }]
              }}
            onEnter={() => this.setState({ buttonColor: 'rgba(61, 0, 144, 0.7)' })}
            onExit={() => this.setState({ buttonColor: 'rgba(10, 10, 10, 0.7)' })}
            onClick={ this._displayNewPano }>
            <Text  style={{
              fontWeight: '600',
              textAlign: 'center',
              textAlignVertical: 'center',
            }}>
              &gt;
            </Text>
          </VrButton>
        </View>
      </View>
    );
  }
};

AppRegistry.registerComponent('vrpanoexpo', () => vrpanoexpo);

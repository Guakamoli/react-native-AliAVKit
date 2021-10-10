
import React, { Component, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import _ from 'lodash';
import Toast, { DURATION } from 'react-native-easy-toast'
import CameraRoll from "@react-native-community/cameraroll";
import { FlatGrid } from 'react-native-super-grid';
import Video from 'react-native-video';

const FLASH_MODE_AUTO = 'auto';
const FLASH_MODE_ON = 'on';
const FLASH_MODE_OFF = 'off';

const { width, height } = Dimensions.get('window');
const captureIcon = (width - 98) / 2
const captureIcon2 = (width - 20) / 2;
const photosItem = (width / 4);



export type Props = {
  ratioOverlay?: string,
  closeImage: any,
  goback: any

  multipleBtnImage: any
  postCameraImage: any
  startMultipleBtnImage: any
  changeSizeImage: any
 
  scrollViewWidth: boolean
}

type State = {

  CameraRollList: any,

  photoSelectType: string
  multipleData: any
  startmMltiple: boolean

  photoAlbum: any
  photoAlbumselect: any
  pasterList: any
  videoFile: any
  facePasterInfo: any
  filterName:any
}


export default class CameraScreen extends Component<Props, State> {
  camera: any;
  myRef: any
  editor:any

  constructor(props) {
    super(props);
    this.myRef = React.createRef();

    this.state = {
      CameraRollList: [],
      photoSelectType: '',
      multipleData: [],
      startmMltiple: false,
      photoAlbum: [],
      photoAlbumselect: {},
      videoFile: '',
      scrollViewWidth: true,
      // 
      pasterList: [],
      facePasterInfo: {},
      filterName:"原片"
    };
  }


  componentDidMount() {
    //获取照片
    var getPhotos = CameraRoll.getPhotos({
      first: 30,
      assetType: 'All',
      //todo  安卓调试隐藏
      include: ["playableDuration", 'filename', 'fileSize', 'imageSize',],
      // groupTypes: 'Library'
    })
    var getAlbums = CameraRoll.getAlbums({
      assetType: 'All',

    })
    getAlbums.then((data) => {

      // 获取相册封面
      data.map(async (item) => {
        const cover = await CameraRoll.getPhotos({ first: 1, assetType: 'Photos', groupName: `${item.title}` })
        // 通过相册 名称获取
        data.map(item2 => {
          if (item2.title == cover.edges[0].node.group_name) {
            item2.cover = cover.edges[0].node.image.uri
          }
        })
      })
      // 相册数据
      this.setState({ photoAlbum: data, photoAlbumselect: data[0] })
    })

    getPhotos.then(async (data) => {
      var edges = data.edges;
      var photos = [];
      for (var i in edges) {
        // ios文件
        photos.push(edges[i].node);
      }
      this.setState({
        CameraRollList: photos
      });
    }, function (err) {
      // alert( '获取照片失败！' );
    });
  }
  sendUploadFile(data) {
    if (this.props.getUploadFile) {
      this.props.getUploadFile(data);
    }
  }
  postHead() {
    return (
      <View style={{ height: 44, backgroundColor: '#000', flexDirection: "row", justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12 }}>
        <TouchableOpacity onPress={() => {
          this.props.goback()
        }} >
          <Image
            style={styles.closeIcon}
            source={this.props.closeImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <Text style={{ fontSize: 17, fontWeight: '500', color: "#fff", lineHeight: 24 }}>新作品</Text>
        <TouchableOpacity onPress={() => {


          let uplaodFile = []
          console.log('this.state.multipleData', this.state.multipleData);
          if (this.state.multipleData.length > 0) {
            this.state.multipleData.map(async (multipleDataItem) => {
              const { image: { uri, width, height, filename, fileSize, playableDuration }, type } = multipleDataItem
              let image_type = type + '/' + filename.split('.')[1]
              let localUri = await CameraRoll.requestPhotoAccess(uri.slice(5));
              if (this.state.photoSelectType === 'image') {
                uplaodFile.push({
                  image_type,
                  image_dimensions: { width, height },
                  image_url: localUri,
                  image_size: fileSize,
                  title: filename
                })
              } else {
                uplaodFile.push({
                  video_type: image_type,
                  type: "file",
                  title_link: localUri,
                  video_size: fileSize,
                  title: filename
                })
              }
            })

          }
          // 选择本地文件 数据
          this.sendUploadFile(uplaodFile)
        }}>
          <Text style={{ fontSize: 15, fontWeight: '400', color: "#fff", lineHeight: 21 }}>继续</Text>
        </TouchableOpacity>
      </View>
    )
  }
  postContent() {
    const { multipleData, CameraRollList, photoSelectType, videoFile, } = this.state;

    return (
      <SafeAreaView style={{ flex: 1, padding: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ececec', position: 'relative' }}>

        <TouchableOpacity style={{
          width: 31,
          height: 31, marginRight: 10, position: 'absolute', left: 15, bottom: 20, zIndex: 99
        }} onPress={() => {
          this.setState({ scrollViewWidth: !this.state.scrollViewWidth })
        }}>
          <Image
            style={[{
              width: 31,
              height: 31,
            }]}
            source={this.props.changeSizeImage}

          />
        </TouchableOpacity>
        <ScrollView style={{
          height: 'auto',
          margin: 'auto',
          paddingHorizontal: 0,
          backgroundColor: '#ececec',
          width: this.state.scrollViewWidth ? width : 320
        }}
          pinchGestureEnabled={true}
        >
          {
            photoSelectType === 'image' ? <Image
              style={[{
                width: width,
                height: height - 300,
              },]}
              // 安卓展示不出来 权限问题？？？？ 
              // source={{ uri: item.image.uri }}
              source={{ uri: (multipleData.length > 0 ? multipleData[multipleData.length - 1]?.image?.uri : CameraRollList[0]?.image?.uri) }}
            /> :
              <Video
                source={{ uri: videoFile }}
                style={{
                  width: width,
                  height: height - 160,
                }} />
          }
        </ScrollView>
      </SafeAreaView>
    )
  }
  postFileUploadHead() {
    const { startmMltiple, multipleData } = this.state;

    return (
      <View style={{ height: 58, backgroundColor: '#000', flexDirection: "row", justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12 }}>
        <TouchableOpacity onPress={() => { }}>
          <View>
            <Text style={{ fontSize: 17, fontWeight: '500', color: "#fff", lineHeight: 24 }}>最近相册</Text>
          </View>
        </TouchableOpacity>
        <View style={{ flexDirection: "row", justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => {
            if (startmMltiple && multipleData.length) {
              this.setState({ multipleData: [multipleData[multipleData.length - 1]] })
            }
            this.setState({ startmMltiple: !startmMltiple, })
          }} >
            <Image
              style={[styles.multipleBtnImage, { marginRight: 10 }]}
              source={startmMltiple ? this.props.startMultipleBtnImage : this.props.multipleBtnImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Image
            style={styles.multipleBtnImage}
            source={this.props.postCameraImage}
            resizeMode="contain"
          />
        </View>
      </View>
    )
  }
  postFileUpload() {
    const { CameraRollList, multipleData, startmMltiple, photoSelectType } = this.state;

    const formatSeconds = (s) => {
      let t = '';
      if (s > -1) {
        let min = Math.floor(s / 60) % 60;
        let sec = s % 60;
        if (min < 10) { t += "0"; }
        t += min + ":";
        if (sec < 10) { t += "0"; }
        t += sec;
      }
      return t;
    }
    const getVideFile = async (fileType, item) => {
      if (fileType !== 'video') return ''
      let myAssetId = item?.image?.uri.slice(5);
      // 获取视频文件 url 
      console.log(myAssetId, 'myAssetId');

      let localUri = await CameraRoll.requestPhotoAccess(myAssetId);
      this.setState({ videoFile: localUri })
    }
    return (
      <>
        {this.postFileUploadHead()}
        <View style={[{ height: 291, backgroundColor: '#000', }, Platform.OS === 'android' ? { paddingBottom: 10 } : { paddingBottom: 35 }]}>
          <FlatGrid
            itemDimension={photosItem}
            data={CameraRollList}
            spacing={0}
            itemContainerStyle={{ margin: 0 }}
            renderItem={({ index, item }) => {
              const { type, image, } = item;
              const { photoSelectType, startmMltiple } = this.state
              // const a =timestamp
              return (
                <TouchableOpacity onPress={() => {
                  //  第一次
                  if (multipleData.length <= 1) {
                    // 获取第一次选择类型
                    let fileType = type.split('/')[0];
                    if (fileType === 'video') {
                      getVideFile(fileType, item)
                    }
                    this.setState({
                      photoSelectType: fileType,
                      multipleData: [item]
                    })

                  }
                  if (startmMltiple) {
                    // 图片大于10 || 视频 大于 1 
                    if (photoSelectType == 'image') {
                      if (multipleData.length == 10) {
                        this.myRef.current.show('最多十张图片', 2000);
                        return;
                      }
                    } else {
                      if (multipleData.length = 1) {
                        this.myRef.current.show('最多选择一个视频', 2000);
                        return;
                      }
                    }
                    let datalist = multipleData;
                    // 已经选择了
                    if (datalist.includes(item)) {
                      // 循环找到选中的 去掉
                      datalist.map((datalistitem, index) => {
                        if (datalistitem.image.uri == image.uri) {
                          datalist.splice(index, 1);
                        }
                      })
                    } else {
                      datalist.push(item)
                    }
                    this.setState({
                      multipleData: datalist
                    })


                  }
                }}
                  disabled={!(type.indexOf(photoSelectType) !== -1) && startmMltiple}
                  activeOpacity={0.9}
                >
                  <View style={[{

                    position: 'relative',

                  },]}>

                    {
                      startmMltiple ? (
                        <>
                          < Image source={this.props.captureButtonImage} style={[{ width: 20, height: 20, position: 'absolute', right: 5, top: 5, zIndex: 98 }]} />
                          {
                            multipleData.includes(item) ? <View style={[
                              { width: 18, height: 18, borderRadius: 20, position: 'absolute', right: 6, top: 6, zIndex: 99, backgroundColor: '#836BFF', justifyContent: 'center', alignItems: 'center' },
                            ]}>
                              <Text style={{ color: '#fff', fontSize: 13, right: 5, position: 'absolute', top: 0, fontWeight: '400' }}>
                                {multipleData.indexOf(item) !== -1 ? multipleData.indexOf(item) + 1 : 1}
                              </Text>
                            </View> : null
                          }

                        </>
                      ) : null
                    }
                    <Image
                      key={index}
                      style={[{
                        width: photosItem,
                        height: photosItem,

                      }, !(type.indexOf(photoSelectType) !== -1) && startmMltiple ? { opacity: 0.4 } : {}]}
                      // 安卓展示不出来 权限问题？？？？ 
                      source={{ uri: item.image.uri }}
                      // source={require('../example/images/11.png')}
                      resizeMode="cover"
                    />
                    <View style={[{
                      width: photosItem,
                      height: photosItem,
                      position: 'absolute',
                      backgroundColor: '#fff',

                    }, multipleData[multipleData.length - 1]?.image.uri === image.uri ? { opacity: 0.5 } : { opacity: 0 }]}>
                    </View>
                    {
                      image.playableDuration ? <Text style={{ color: '#fff', fontSize: 12, fontWeight: '400', lineHeight: 17, zIndex: 100, position: "absolute", right: 8, bottom: 7 }}> {formatSeconds(Math.ceil(image.playableDuration ?? 0))}</Text> : null
                    }

                  </View>
                </TouchableOpacity>
              )
            }
            }
          />
        </View>
      </>
    )
  }
  render() {
    return (
      <>
        {/* {Platform.OS !== 'android' ? <View style={{ height: 44, backgroundColor: "#000" }}></View> : null} */}
        {
         
              <>
                {/* post */}
                {this.postHead()}
                {this.postContent()}
                {this.postFileUpload()}
              </>
            
        }
      </>
    );
  }
}

const styles = StyleSheet.create(
  {
    closeIcon: {
      width: 28,
      height: 28,
    },
 
    captureButton: {
      width: 49,
      height: 49,
      backgroundColor: "#fff",
      borderRadius: 49,
      position: 'absolute'
    },
    captureButtonImage: {
      position: 'absolute',
      left: captureIcon,
      zIndex: -11,
      elevation: 1,
      top: - 7,
    },
    multipleBtnImage: {
      width: 31,
      height: 31
    },

  });

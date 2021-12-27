import React, { Component, useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  NativeModules,
  Pressable,
  Animated,
  ScrollView,
  NativeEventEmitter,
  Platform,
} from 'react-native';
import _ from 'lodash';
import Toast, { DURATION } from 'react-native-easy-toast';
import CameraRoll from '@react-native-community/cameraroll';
import { FlatGrid } from 'react-native-super-grid';
import Video from 'react-native-video';
import Carousel from 'react-native-snap-carousel';
import Trimmer from './react-native-trimmer';
import VideoEditor from './VideoEditor';
import AVService from './AVService';

import TextEffect from './components/text/TextEffect';

import {
  Grayscale,
  Temperature,
  Sepia,
  Warm,
  Vintage,
  Tint,
  Technicolor,
  Tritanopia,
  Browni,
  Achromatopsia,
  Deuteranomaly,
  Tritanomaly,
  Polaroid,
  Cool,
  Invert,
  Emboss,
  SrcOverComposition,
  TextImage,
} from 'react-native-image-filter-kit';
import ImageMap from '../images';
const { postNoVolumePng, postvolumePng, postnoVolumeImage } = ImageMap;
import { Button } from 'react-native-elements';

// let a  = require('../images/postEditorNoMute.png');

const { width, height } = Dimensions.get('window');
const captureIcon = (width - 98) / 2;
const { RNEditViewManager, AliAVServiceBridge } = NativeModules;
const photosItem = width / 4;
const cropWidth = width - 30 * 2;
const PostHead = React.memo((props) => {
  const { videoMute, setvideoMute } = props;

  const {
    params: { fileType = '' },
    closePng,
    volumeImage,
    noVolumeImage,
    goback,
    continueEdit,
    continueRef,
  } = props;
  return (
    <View
      style={{
        height: 44,
        backgroundColor: '#000',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Pressable
        onPress={async () => {
          if (continueRef.current) return;
          goback();
        }}
        style={{
          height: 30,
          width: 40,
          paddingHorizontal: 12,

          justifyContent: 'center',
        }}
      >
        <Image style={styles.closeIcon} source={require('../images/backArrow.png')} resizeMode='contain' />
      </Pressable>
      {fileType === 'video' ? (
        <TouchableOpacity
          onPress={() => {
            setvideoMute(!videoMute);
          }}
        >
          <Image style={{ width: 22, height: 21 }} source={!videoMute ? postvolumePng : postnoVolumeImage} />
        </TouchableOpacity>
      ) : null}

      <Pressable
        onPress={continueEdit}
        style={{
          height: 30,
          paddingHorizontal: 12,

          justifyContent: 'center',
          alignItems: 'flex-end',
        }}
      >
        <Text style={styles.continueText}>继续</Text>
      </Pressable>
    </View>
  );
});
const PostEditor = (props) => {
  // const {params:{fileType='',trimVideoData="",trimmerRight="",videoduration=''}} = props;
  const {
    params: { trimVideoData = '', fileType = '' },

    navigation,
    uploadFile,
    volumeImage,
    noVolumeImage,
  } = props;
  const [multipleSandBoxData, setmultipleSandBoxData] = useState([]);
  const [filterList, setfilterList] = useState([]);
  const [filterName, setfilterName] = useState(null);
  const [videoMute, setvideoMute] = useState(false);
  const [coverList, setcoverList] = useState([]);
  const [coverImage, setcoverImage] = useState('');
  const [selectBottomModel, setselectBottomModel] = useState('滤镜');
  const [trimmerLeftHandlePosition, settrimmerLeftHandlePosition] = useState(0);
  const [trimmerRightHandlePosition, settrimmerRightHandlePosition] = useState(0);
  const [videoTime, setVideoTime] = useState(0);
  const [scrubberPosition, setscrubberPosition] = useState(0);
  const [exportVideo, setexportVideo] = useState(false);
  const scrollAniRef = useRef(new Animated.Value(10)).current;
  const aniRef = useRef(null);
  const toast = useRef();
  const toastAnim = useRef(new Animated.Value(1)).current;
  const [imgfilterName, setImgFilterName] = useState('');
  const stopRef = useRef(false);
  const startRef = useRef(false);
  const lockRef = useRef(false);
  const continueRef = useRef(false);
  const [photoFile, setPhotoFile] = useState('');
  const outputPathRef = useRef(null);

  const continueEdit = async () => {
    console.log("continueEdit111", photoFile);
    if (continueRef.current) return;
    continueRef.current = true;
    const cropData = props.params.cropDataResult;


    if (fileType === 'image') {
      try {
        const path = photoFile;
        console.log("导出上传",path);
        let uploadFile = [];
        uploadFile.push({
          Type: `image/png`,
          path: path,
          size: 0,
          Name: path,
          coverImage: path,
        });
        props.getUploadFile(uploadFile);
        props.goback();
      } catch (e) {
        console.info(e, '错误');
        setTimeout(() => {
          continueRef.current = false;
        }, 1500);
      }
    } else {
      // 裁剪视频

      // toast.current.show('正在导出, 请不要离开', 0);
      if (!filterName && videoTime === trimmerRightHandlePosition - trimmerLeftHandlePosition) {
        return onExportVideo({ outputPath: multipleSandBoxData[0], exportProgress: 1 });
      }
      toast.current.show(
        <Button
          buttonStyle={{
            backgroundColor: 'transparent',
          }}
          loadingStyle={{
            width: 55,
            height: 45,
            backgroundColor: 'transparent',
          }}
          style={{ backgroundColor: 'transparent' }}
          containerStyle={{
            backgroundColor: 'transparent',
          }}
          loading
          loadingProps={{ size: 'large' }}
        />,

        0,
      );
      //TODO
      if (Platform.OS === 'ios') {
        RNEditViewManager.trimVideo({
          videoPath: multipleSandBoxData[0],
          startTime: trimmerLeftHandlePosition / 1000,
          endTime: trimmerRightHandlePosition / 1000,
        });
      } else {
        const isTrim = await editor?.trimVideo({
          videoPath: multipleSandBoxData[0],
          startTime: trimmerLeftHandlePosition,
          endTime: trimmerRightHandlePosition,
        });
        console.log('设置视频裁剪起止时间成功', isTrim);
      }

      // 导出视频
      if (exportVideo) {
        return;
      }
      aniRef.current.stop();
      setexportVideo(true);
    }
  };
  let coverData = [];
  let editor = null;
  let scrubberInterval = null;
  const getFilters = async () => {
    //{iconPath: '.../柔柔/icon.png', filterName: '柔柔'}

    const infos = await AVService.getFilterIcons({});

    infos.unshift({ filterName: null, iconPath: '', title: '无效果' });
    setfilterList(infos);
  };

  useEffect(() => {
    getFilters();
    const { params } = props;

    if (!params) return null;
    setmultipleSandBoxData([params?.trimVideoData]);
    setVideoTime(params?.videoduration);
    settrimmerRightHandlePosition(params?.trimmerRight);
    Animated.timing(
      // 随时间变化而执行动画
      toastAnim, // 动画中的变量值
      {
        toValue: 0, // 透明度最终变为1，即完全不透明
        duration: 3000, // 让动画持续一段时间
        useNativeDriver: true,
      },
    ).start();
  }, [props.params]);
  useEffect(() => {
    const managerEmitter = new NativeEventEmitter(AliAVServiceBridge);
    const subscription = managerEmitter.addListener('cropProgress', (reminder) => {
      if (reminder.progress == 1 && fileType === 'video') {
        // 可以再这里做loading
        toast.current.close();
      }
    });
    return () => {
      console.info('销毁了', subscription);
      AVService.removeThumbnaiImages();
      //TODO
      if (Platform.OS === 'ios') {
        RNEditViewManager.stop();
      } else {
        editor?.release();
      }
      props.params?.playVideo?.();
      managerEmitter.removeAllListeners('cropProgress');
    };
  }, []);
  const getcoverData = async () => {
    try {
      if (fileType == 'image') {
        return null;
      }

      const videoTimeSecond = videoTime / 1000;

      let itemPerTime = videoTime / 13;
      if (videoTimeSecond < 10) {
        itemPerTime = videoTime / 8;
      }

      //TODO
      const cropData = props.params.cropDataResult;
      const Wscale = 1080 / props.params.cropDataRow.srcSize.width;
      const Hscale = 1920 / props.params.cropDataRow.srcSize.height;

      let thumbnailsArgument = {
        videoPath: multipleSandBoxData[0],
        startTime: 0,
        itemPerTime: Math.floor(itemPerTime),
      };
      if (Platform.OS != 'ios') {
      }
      coverData = await AVService.getThumbnails(thumbnailsArgument);

      setcoverList(coverData);
      setcoverImage(coverData[0]);
    } catch (e) {
      console.info(e);
    }
  };
  useEffect(() => {
    if (multipleSandBoxData.length > 0) {
      getcoverData();
    }
  }, [multipleSandBoxData]);

  const onExportVideo = async (event) => {
    try {
      if (event.exportProgress === 1) {
        // const cropData = props.params.cropDataResult;
        let outputPath = event.outputPath;
        // const Wscale = 1080 / props.params.cropDataRow.srcSize.width;
        // const Hscale = 1920 / props.params.cropDataRow.srcSize.height;
        // let preOutputPath = outputPath;
        // outputPath = await AVService.crop({
        //   source: `file://${outputPath}`,
        //   cropOffsetX: cropData.offset.x,
        //   cropOffsetY: cropData.offset.y * Hscale,
        //   cropWidth: cropData.size.width * Wscale,
        //   cropHeight: cropData.size.height * Wscale,
        //   duration: (trimmerRightHandlePosition - trimmerLeftHandlePosition) / 1000,
        // });
        // CameraRoll.deletePhotos([preOutputPath, ...coverList]);

        CameraRoll.deletePhotos(coverList);
        let uploadFile = [];
        //
        let type = outputPath.split('.');
        //TODO
        let uploadCoverImage = '';
        if (Platform.OS === 'ios') {
          uploadCoverImage = coverImage ? `file://${encodeURI(coverImage)}` : '';
        } else {
          uploadCoverImage = coverImage ? `${encodeURI(coverImage)}` : '';
        }
        uploadFile.push({
          Type: `${fileType}/${type[type.length - 1]}`,
          path: fileType == 'video' ? `file://${encodeURI(outputPath)}` : outputPath,
          size: 0,
          Name: outputPath,
          coverImage: uploadCoverImage,
        });

        props.getUploadFile(uploadFile);
        setTimeout(() => {
          props.goback();
        }, 0);
      }
    } catch (e) {
      console.info(e);
    }
  };

  const postEditorViewData = () => {
    const delta = trimmerRightHandlePosition - trimmerLeftHandlePosition;
    const top = props.params.cropDataRow.positionY;

    const width1 = props.params.cropDataRow.fittedSize.width;
    const height1 = props.params.cropDataRow.fittedSize.height;
    const srcWidth = props.params.cropDataRow.srcSize.width;
    const srcHeight = props.params.cropDataRow.srcSize.height;
    const rowData = props.params.cropDataRow.srcSize;
    // 这里裁减策略修改为超出一定比例的时候自动裁切
    const windowWidth = width;

    let videoBoxWidth = windowWidth;
    let videoBoxHeight = windowWidth;
    let videoWidth = windowWidth;
    let videoHeight = windowWidth;
    // 只处理小于和大于的情况
    const wHRatio = rowData.width / rowData.height;
    if (wHRatio > 2) {
      videoBoxWidth = windowWidth;
      videoBoxHeight = windowWidth / 2;
      videoHeight = windowWidth / 2;
      videoWidth = videoHeight * wHRatio;
    } else if (wHRatio < 4 / 5) {
      videoBoxWidth = windowWidth;
      videoBoxHeight = (windowWidth / 4) * 5;
      videoWidth = windowWidth;
      videoHeight = videoWidth / wHRatio;
    } else {
      // 宽小于高但是没有超出限制,以屏幕宽乘以比例为主
      videoBoxWidth = windowWidth;
      videoBoxHeight = windowWidth / wHRatio;
      videoWidth = windowWidth;
      videoHeight = windowWidth / wHRatio;
    }
    const videoStyle = {
      width: videoWidth,
      height: videoHeight,
    };
    const videoBoxStyle = {
      width: windowWidth,
      height: windowWidth,
    };
    return (
      <View
        style={[
          {
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'black',
            width: width,
            height: width,
            overflow: 'hidden',
          },
          videoBoxStyle,
        ]}
      >
        <View
          // style={{
          //   width: width1,
          //   height: height1,
          //   transform: [
          //     {
          //       translateY: top,
          //     },
          //   ],
          // }}
          style={videoStyle}
        >
          <VideoEditor
            // editWidth={width1}
            // editHeight={height1}
            mediaInfo={{
              outputSize: { width: srcWidth, height: srcHeight },
            }}
            editStyle={videoStyle}
            ref={(edit) => (editor = edit)}
            filterName={filterName}
            //TODO
            videoPath={multipleSandBoxData[0] ?? props.params.trimVideoData}
            saveToPhotoLibrary={false}
            startExportVideo={exportVideo}
            videoMute={videoMute}
            onExportVideo={(event) => {
              onExportVideo(event);
            }}
            onPlayProgress={({ nativeEvent }) => {
              if (
                nativeEvent.playProgress * 1000 >= trimmerLeftHandlePosition &&
                !startRef.current &&
                !lockRef.current
              ) {
                startRef.current = true;
                aniRef.current = Animated.timing(
                  // 随时间变化而执行动画
                  scrollAniRef, // 动画中的变量值
                  {
                    toValue: Math.min(delta / videoTime, 1) * cropWidth, // 透明度最终变为1，即完全不透明
                    duration: delta, // 让动画持续一段时间
                    useNativeDriver: true,
                  },
                );
                aniRef.current.start();
              }
              if (fileType === 'video') {
                if (
                  nativeEvent.playProgress === undefined ||
                  (nativeEvent.playProgress * 1000 >= trimmerRightHandlePosition &&
                    !stopRef.current &&
                    !lockRef.current)
                ) {
                  stopRef.current = true;
                  startRef.current = false;

                  aniRef.current.stop();

                  scrollAniRef.setValue(0);
                  stopRef.current = false;
                  //TODO
                  if (Platform.OS === 'ios') {
                    RNEditViewManager.pause();
                    RNEditViewManager.seekToTime(trimmerLeftHandlePosition / 1000);
                    setTimeout(() => {
                      RNEditViewManager.play();
                    }, 500);
                  } else {
                    editor?.onSeek(trimmerLeftHandlePosition);
                    //android 默认为循环播放
                    // editor?.onStop()
                  }
                  return;
                }
              }
            }}
          />
        </View>
      </View>
    );
  };
  // 滤镜组件
  const filterEditorFilter = () => {
    return (
      <View style={{ bottom: height * 0.15, position: 'absolute' }}>
        <FlatList
          data={filterList}
          initialNumToRender={4}
          horizontal={true}
          renderItem={({ index, item }) => {
            return (
              <View style={{ height: 130, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <TouchableOpacity
                  onPress={() => {
                    if (continueRef.current) return;
                    setfilterName(item?.filterName);
                  }}
                >
                  <View
                    style={[
                      { marginRight: 4 },
                      filterName == item.filterName && { borderWidth: 2, borderColor: '#fff' },
                    ]}
                  >
                    {item.filterName == null ? (
                      <View
                        style={{
                          width: 100,
                          height: 100,
                          backgroundColor: 'rgba(69, 69, 73, 0.7);',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Image style={{ width: 44, height: 44 }} source={postNoVolumePng} />
                      </View>
                    ) : (
                      <Image style={{ width: 100, height: 100 }} source={{ uri: item.iconPath }} />
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>
    );
  };

  // 裁剪
  const postTrimer = () => {
    const onHandleChange = async ({ leftPosition, rightPosition }) => {
      if (leftPosition < 0) {
        leftPosition = 0;
      }
      if (rightPosition < 2000) {
        rightPosition = 2000;
      }
      scrollAniRef.setValue(0);

      //TODO

      if (Platform.OS === 'ios') {
        RNEditViewManager.seekToTime(leftPosition / 1000);
        setTimeout(() => {
          lockRef.current = false;
          RNEditViewManager.play();
          stopRef.current = false;
          startRef.current = false;
        }, 500);
      } else {
        editor?.onSeek(leftPosition);
      }

      settrimmerLeftHandlePosition(leftPosition);
      settrimmerRightHandlePosition(rightPosition);
      setscrubberPosition(leftPosition);
    };

    return (
      <>
        <View style={{ paddingHorizontal: 5, bottom: 140, position: 'absolute' }}>
          <Trimmer
            onHandleChange={onHandleChange}
            totalDuration={videoTime}
            initialZoomValue={1}
            maxTrimDuration={trimmerRightHandlePosition}
            trimmerLeftHandlePosition={trimmerLeftHandlePosition}
            trimmerRightHandlePosition={trimmerRightHandlePosition}
            scrubberPosition={scrubberPosition}
            onScrubbingComplete={() => {
              // RNEditViewManager.replay();
            }}
            scrollAniRef={scrollAniRef}
            tintColor='white'
            markerColor='#5a3d5c'
            trackBackgroundColor='white'
            trackBorderColor='#5a3d5c'
            scrubberColor='white'
            onScrubberPressIn={() => {
              console.log('onScrubberPressIn');
            }}
            onRightHandlePressIn={() => {
              if (continueRef.current) return;

              stopRef.current = true;
              startRef.current = false;
              ``;
              lockRef.current = true;
              aniRef.current.stop();

              scrollAniRef.setValue(0);

              if (Platform.OS === 'ios') {
                RNEditViewManager.pause();
              } else {
                editor?.onPause();
              }
            }}
            trackWidth={cropWidth}
            onLeftHandlePressIn={() => {
              if (continueRef.current) return;

              aniRef.current.stop();
              lockRef.current = true;

              stopRef.current = true;
              startRef.current = false;

              scrollAniRef.setValue(0);

              RNEditViewManager.pause();
            }}
            trackHeight={50}
          >
            <View style={{ flexDirection: 'row' }}>
              {coverList.map((i, index) => {
                return (
                  <Image
                    key={index}
                    source={{ uri: i }}
                    style={{ width: cropWidth / coverList.length, height: 50 }}
                    resizeMode={'cover'}
                  />
                );
              })}
            </View>
          </Trimmer>
        </View>
      </>
    );
  };
  // 封面
  const postCover = () => {
    return (
      <View style={{ marginTop: 93, paddingHorizontal: 17 }}>
        <FlatList
          data={coverList}
          initialNumToRender={7}
          horizontal={true}
          renderItem={({ index, item }) => {
            return (
              <View style={{ height: 130 }}>
                {/* 封面选择 */}
                <TouchableOpacity
                  onPress={() => {
                    setcoverImage(item);
                  }}
                >
                  <Image
                    source={{ uri: item }}
                    style={{ width: 65, height: 74, backgroundColor: 'green', marginRight: 2 }}
                  />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>
    );
  };
  // 裁剪弹框
  const cropToast = () => {
    return (
      <Animated.View
        style={[
          styles.toastBox,
          {
            opacity: toastAnim,
          },
        ]}
      >
        <Text style={{ color: '#000', fontSize: 14, fontWeight: '500' }}>请修剪视频,视频时长不能超过5分钟。</Text>
        <View style={styles.toastShow}></View>
      </Animated.View>
    );
  };
  // 切换底部功能
  const switchProps = () => {
    let switchProps;
    if (fileType !== 'image') {
      switchProps = ['滤镜', '修剪'];
    } else {
      //WUYQ
      switchProps = ['滤镜', '文字'];
    }

    return (
      <View
        style={{
          height: 40,
          width: width,
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'flex-start',
          position: 'absolute',
          bottom: 43,
        }}
      >
        {videoTime / 1000 > 300 && cropToast()}
        {switchProps.map((item, index) => {
          return (
            <TouchableOpacity
              style={{ height: 50 }}
              key={index}
              onPress={() => {
                setselectBottomModel(item);
              }}
            >
              <Text style={[styles.postSwitchProps, selectBottomModel === item ? { color: '#fff' } : { color: '#8E8E8E' }, { fontSize: 16, marginTop: 'auto', marginBottom: 'auto' }]}>{item}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };
  // 图片滤镜
  const result = () => {
    const left = props.params.cropDataRow.positionX;
    const top = props.params.cropDataRow.positionY;
    const scale = props.params.cropDataRow.scale;

    const Extractor = (imgFilter) => {
      // const width =props.params.cropDataRow.fittedSize.width1
      // const height =props.params.cropDataRow.fittedSize.height
      const ImageComponent = (
        <Image
          style={{
            width: width,
            height: width,
            // transform: [ {
            //     scale: 1
            //   },
            //   { translateX: -100 },
            //   { translateY: -100 },
            // ]
          }}
          source={{ uri: multipleSandBoxData[0] }}
        />
      );


      var textStyles = [
        {
          text: "呵呵呵呵呵呵\n哈哈哈",
          textAlign: "right",
          color: "#FFFF00",
          backgroundColor: "#0000ff",
          fontSize: 20,
          fontName: "sd",
          x: -50,
          y: 50,
          scale: 2,
          rotate: 0,
        },
        {
          text: "垂直垂直垂直\n竖直竖直",
          textAlign: "left",
          color: "#FF00FF",
          backgroundColor: "#0000ff",
          fontSize: 40,
          fontName: "sd",
          x: 0,
          y: 0,
          scale: 1,
          rotate: 1.57,
        },
        {
          text: "反斜反斜反斜反斜\n反斜反斜",
          textAlign: "right",
          color: "#6600FF",
          backgroundColor: "#0000ff",
          fontSize: 30,
          fontName: "sd",
          x: 100,
          y: 100,
          scale: 1.0,
          rotate: 0.8,
        },
        {
          text: "斜的斜的斜的斜的\n斜的斜的斜的",
          textAlign: "left",
          color: "#FF6600",
          backgroundColor: "#0000ff",
          fontSize: 30,
          fontName: "sd",
          x: 100,
          y: -100,
          scale: 1.0,
          rotate: -0.8,
        }
      ]

      const getTextComponent = (dst: any, textStyle: any) => {
        const srcImage = (
          <TextImage
            text={textStyle.text}
            fontName={textStyle.fontName}
            fontSize={textStyle.fontSize * textStyle.scale}
            color={textStyle.color}
            textAlign={textStyle.textAlign}
            backgroundColor={textStyle.backgroundColor}
          />
        )
        const tx = textStyle.x / width + 0.5;
        const ty = textStyle.y / width + 0.5;
        return <SrcOverComposition
          resizeCanvasTo={'dstImage'}
          dstImage={dst}
          srcTransform={{
            //srcImage 中心点在屏幕内的位置 0.5 0.5 为屏幕中间
            translate: { x: tx, y: ty },
            scale: 'COVER',
            rotate: textStyle.rotate
          }}
          srcImage={srcImage}
          extractImageEnabled={true}
        />
      }


      const TextComponent = () => {
        var dstView = ImageComponent;
        textStyles.forEach((item, index) => {
          dstView = getTextComponent(dstView, item);
        });
        return dstView;
      }

      switch (imgFilter) {

        case 'TEXT': {
          return TextComponent();
        }

        case 'Sepia2': {
          return <Sepia image={ImageComponent} amount={2} />;
        }
        case 'Temperature': {
          return <Temperature amount={0.5} image={ImageComponent} />;
        }
        case 'Sepia0.4': {
          return <Sepia amount={0.4} image={ImageComponent} />;
        }
        case 'Warm': {
          return <Warm image={ImageComponent} />;
        }
        case 'Browni': {
          return <Browni image={ImageComponent} />;
        }
        case 'Tint': {
          return <Tint amount={0.2} image={ImageComponent} />;
        }
        case 'Technicolor': {
          return <Technicolor image={ImageComponent} />;
        }
        case 'Tritanomaly': {
          return <Tritanomaly image={ImageComponent} />;
        }
        case 'Tritanopia': {
          return <Tritanopia image={ImageComponent} />;
        }
        case 'Deuteranomaly': {
          return <Deuteranomaly image={ImageComponent} />;
        }
        case 'Invert': {
          return <Invert image={ImageComponent} firstColor={'#FFE580'} secondColor={'pink'} />;
        }
        case 'EmbossPolaroid': {
          return <Emboss image={<Polaroid image={ImageComponent} />} />;
        }
        case 'EmbossCool': {
          return <Emboss image={<Cool image={ImageComponent} />} />;
        }
        case 'EmbossAchromatopsia': {
          return <Emboss image={<Achromatopsia image={ImageComponent} />} />;
        }

        default: {
          return ImageComponent;
        }
      }
    };
    const propsImage = () => {
      return (
        <Image
          style={{ width: 100, height: 100, marginRight: 5, marginBottom: 5, marginTop: 20 }}
          // source={require('./parrot.png')}
          source={{ uri: multipleSandBoxData[0] }}
          resizeMode={'contain'}
        />
      );
    };
    const propsTitles = (title) => {
      return <Text style={{ color: 'white', fontSize: 16, marginLeft: 40 }}>{title}</Text>;
    };
    return (
      <>
        <View style={{ width: width, height: width, overflow: 'hidden' }}>
          <View
            style={
              {
                // overflow: 'hidden',
                // alignItems: 'center',
                // justifyContent: 'center',
              }
            }
          >
            <Grayscale
              amount={0}
              onExtractImage={({ nativeEvent }) => {

                console.log("save phont", nativeEvent.uri);
                // CameraRoll.save(nativeEvent.uri, { type: 'photo' })

                setPhotoFile(nativeEvent.uri);
              }}
              extractImageEnabled={true}
              image={Extractor(imgfilterName)}
            ></Grayscale>
          </View>
        </View>

{/*       //WUYQ  */}
        <TextEffect
          {...props}
          isTextEdit={selectBottomModel === '文字'}
          width={width}
          height={width}
          onContinueEdit={(uri: any) => {
            console.log("continueEdit222", uri);
            setPhotoFile(uri);
            continueEdit();
          }}
          photoFile={photoFile}
        />

        {selectBottomModel === '滤镜' && <ScrollView horizontal={true} contentContainerStyle={{ alignItems: 'center' }}>

          <TouchableOpacity
            onPress={() => {
              setImgFilterName('TEXT');
            }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                backgroundColor: 'rgba(69, 69, 73, 0.7);',
                marginRight: 5,
                marginBottom: 5,
                marginTop: 20,
              }}
            >
              <Image style={{ width: 100, height: 100 }} source={props.noResultPng} />
            </View>
            {propsTitles('TEXT')}
          </TouchableOpacity>


          <TouchableOpacity
            onPress={() => {
              setImgFilterName('');
            }}
          >
            <View
              style={{
                width: 100,
                height: 100,
                backgroundColor: 'rgba(69, 69, 73, 0.7);',
                marginRight: 5,
                marginBottom: 5,
                marginTop: 20,
              }}
            >
              <Image style={{ width: 100, height: 100 }} source={props.noResultPng} />
            </View>
            {propsTitles('M1')}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setImgFilterName('Tritanomaly');
            }}
          >
            <Tritanomaly image={propsImage()} />
            {propsTitles('M2')}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setImgFilterName('Tritanopia');
            }}
          >
            <Tritanopia image={propsImage()} />
            {propsTitles('M3')}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setImgFilterName('Deuteranomaly');
            }}
          >
            <Deuteranomaly image={propsImage()} />
            {propsTitles('M4')}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setImgFilterName('Sepia0.4');
            }}
          >
            <Sepia amount={0.4} image={propsImage()} />
            {propsTitles('M5')}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setImgFilterName('Sepia2');
            }}
          >
            <Sepia amount={2} image={propsImage()} />
            {propsTitles('M6')}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setImgFilterName('Browni');
            }}
          >
            <Browni image={propsImage()} />
            {propsTitles('M7')}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setImgFilterName('Tint');
            }}
          >
            <Tint amount={0.2} image={propsImage()} />
            {propsTitles('M8')}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setImgFilterName('Invert');
            }}
          >
            <Invert image={propsImage()} firstColor={'#FFE580'} secondColor={'pink'} />
            {propsTitles('M9')}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setImgFilterName('Technicolor');
            }}
          >
            <Technicolor image={propsImage()} />
            {propsTitles('M10')}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setImgFilterName('EmbossCool');
            }}
          >
            <Emboss image={<Cool image={propsImage()} />} />
            {propsTitles('M11')}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setImgFilterName('EmbossAchromatopsia');
            }}
          >
            <Emboss image={<Achromatopsia image={propsImage()} />} />
            {propsTitles('M12')}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setImgFilterName('EmbossPolaroid');
            }}
          >
            <Emboss image={<Polaroid image={propsImage()} />} />
            {propsTitles('M13')}
          </TouchableOpacity>
        </ScrollView>}
      </>
    );
  };
  if (fileType == 'image') {
    return (
      <View style={{ backgroundColor: 'black', position: 'relative', height: '100%' }}>

        <PostHead
          {...props}
          continueEdit={continueEdit}
          videoMute={videoMute}
          setvideoMute={setvideoMute}
          continueRef={continueRef}
        />

{/*       //WUYQ */}
        {(selectBottomModel === '滤镜' || selectBottomModel === '文字') && result()}
        {fileType === 'image' && switchProps()}
      </View>
    );
  }
  return (
    //TODO
    <View style={{ backgroundColor: 'black', position: 'relative', height: '100%' }}>
      <Toast
        ref={toast}
        position='top'
        positionValue={height * 0.4}
        fadeInDuration={1050}
        fadeOutDuration={800}
        opacity={0.8}
      />
      <PostHead
        {...props}
        continueEdit={continueEdit}
        continueRef={continueRef}
        videoMute={videoMute}
        setvideoMute={setvideoMute}
      />
      {postEditorViewData()}

      {selectBottomModel === '滤镜' && filterEditorFilter()}
      {selectBottomModel === '修剪' && postTrimer()}
      {/* {
        selectBottomModel === '封面' && postCover()
      } */}
      {fileType !== 'image' && switchProps()}
    </View>
  );
};


const styles = StyleSheet.create({
  closeIcon: {
    width: 12,
    height: 20,
  },
  postSwitchProps: {
    fontSize: 16,
    color: '#8E8E8E',
    fontWeight: '500',
  },
  continueText: {
    fontSize: 15,
    fontWeight: '400',
    color: '#836BFF',
    lineHeight: 21,
  },
  textCenter: {
    fontSize: 17,
    fontWeight: '500',
    color: '#fff',
    lineHeight: 24,
  },
  toastShow: {
    width: 0,
    height: 0,
    borderWidth: 10,
    borderTopColor: 'rgba(255,255,255,0.85)',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 48,
    right: 40,
  },
  toastBox: {
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.85)',
    position: 'absolute',
    width: 295,
    height: 48,
    bottom: 30,
    left: (width - 295) / 2,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
});

export default PostEditor;

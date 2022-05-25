import React from 'react';

import { AppState, StyleSheet, View, Text, Image, Dimensions, TouchableOpacity, Pressable } from 'react-native'

import CameraRoll from '@react-native-community/cameraroll';

import RNGetPermissions from '../permissions/RNGetPermissions';

import ScrollBottomSheet from 'react-native-scroll-bottom-sheet';

import FastImage from '@rocket.chat/react-native-fast-image';

import { State, NativeViewGestureHandler } from 'react-native-gesture-handler';

import I18n from '../i18n';

import { openSettings } from 'react-native-permissions';

import AVkitPhotoView from '../AVKitPhotoView';


const { width, height } = Dimensions.get('window');

const photoItemWidth = (width - 2) / 3.0;
const photoItemHeight = photoItemWidth * 16 / 9;

import AVService from '../AVService';

class StoryPhoto extends React.Component {

    constructor(props) {
        super(props)
        this.multipleSelectNumber = props.multipleSelectNumber ? props.multipleSelectNumber : 5;

        this.state = {
            singleSelect: props.singleSelect ? props.singleSelect : true,
            photoList: [],
            multipleSelectList: [],
            bottomSheetRefreshing: false,
            isPhotoLimited: false,
        };
        this.bottomSheetRef;
        this.bottomSheetInnerRef;

        // this.getPhotosNum = 36;
    }

    /**
     * 在第一次绘制 render() 之后执行
     */
    componentDidMount() {
        // this.getPhotos();
    }

    /**
     * setState 刷新时触发
     * @returns true 会继续更新； false 不会执行 render
     */
    shouldComponentUpdate(nextProps, nextState) {
        if (this.props.openPhotos !== nextProps.openPhotos) {
            if (nextProps.openPhotos) {
                this.openBottomSheet();
            } else {
                // this.hideBottomSheet();
            }
            return true;
        }
        if (this.state.isPhotoLimited !== nextState.isPhotoLimited) {
            return true;
        }
        if (this.state.photoList !== nextState.photoList) {
            return true;
        }
        if (this.state.singleSelect !== nextState.singleSelect) {
            return true;
        }
        if (this.state.multipleSelectList !== nextState.multipleSelectList) {
            return true;
        }
        if (this.state.bottomSheetRefreshing !== nextState.bottomSheetRefreshing) {
            return true;
        }
        return false;
    }

    /**
     * 销毁
     */
    componentWillUnmount() {
        //当组件要被从界面上移除的时候调用 ,可以做组件相关的清理工作
    }


    // getPhotos = async () => {
    //     const storagePermission = await RNGetPermissions.checkStoragePermissions();

    //     console.info("storagePermission", storagePermission);

    //     if (storagePermission?.permissionStatus === 'limited') {
    //         this.setState({ isPhotoLimited: true });
    //     } else {
    //         this.setState({ isPhotoLimited: false });
    //     }
    //     if (!storagePermission?.isGranted) {
    //         if (await RNGetPermissions.getStoragePermissions(true)) {
    //             this.getPhotos();
    //         }
    //         return;
    //     }
    //     CameraRoll.getPhotos({
    //         first: this.getPhotosNum,
    //         assetType: 'All',
    //         include: ['playableDuration', 'filename', 'fileSize', 'imageSize'],
    //     })
    //         .then(data => {
    //             if (!data?.edges?.length) {
    //                 return;
    //             }
    //             const photoList = [];
    //             for (let i = 0; i < data.edges.length; i++) {
    //                 const itemInfo = data.edges[i].node
    //                 photoList.push(data.edges[i].node);
    //             }
    //             let firstPhotoUri = photoList[0]?.image?.uri
    //             this.props.setFirstPhotoUri(firstPhotoUri);
    //             this.setState({
    //                 photoList: photoList,
    //                 bottomSheetRefreshing: false
    //             });
    //         })
    //         .catch((err) => {
    //             //Error Loading Images
    //         });
    // }

    openBottomSheet = () => {
        this.bottomSheetRef?.snapTo(0);
        setTimeout(() => {
            this.resetToolsBotton(false);
        }, 100);
    }

    hideBottomSheet = () => {
        this.bottomSheetRef?.snapTo(1);
        this.resetToolsBotton(true);
    }

    resetToolsBotton = (isShow = false) => {
        if (isShow) {
            this.props.showBottomTools()
        } else {
            this.props.hideBottomTools()
        }
    }

    clickItemCallback = async (seelctData) => {
        //理论不会出现
        if (seelctData.data.length == 0) {
            return;
        }
        const itemData = seelctData.data[0];
        //原生相册模块会过滤2-60s的视频,这里就不需要判断视频长度了
        const itemUri = itemData.uri;
        const itemType = itemData.type;
        let itemPath = itemData.path;

        if (itemType.includes('image')) {
            //获取后缀
            const imageIndex = itemPath?.lastIndexOf(".");
            const imageType = itemPath?.substr(imageIndex + 1).toLowerCase();
            //不是通用格式，需要先转换
            if (!!imageType && (imageType !== 'jpg' && imageType !== 'png'&& imageType !== 'jpeg')) 
            {
                console.log(imageType);
                itemPath = await AVService.saveToSandBox(itemUri);
            }
        }
        // console.log(itemPath);
        this.props.selectedPhoto(itemPath, itemType.includes('video') ? 'video' : 'image');
        setTimeout(() => {
            this.hideBottomSheet();
        }, 250);
    }


    PhotoHandleView = () => {
        return (
            <View style={[styles.bottomSheetHead, { height: this.state.isPhotoLimited ? 120 : 55 }]}>
                {Platform.OS === 'android' ?
                    <NativeViewGestureHandler
                        disallowInterruption={true}
                        shouldActivateOnStart={true}
                        onHandlerStateChange={(event) => {
                            if (event.nativeEvent.state === State.END) {
                                this.hideBottomSheet();
                            }
                        }}
                    >
                        <View style={styles.bottomSheetHeadClose}>
                            <Text style={styles.bottomSheetHeadCloseText}>{I18n.t('close')}</Text>
                        </View>
                    </NativeViewGestureHandler>
                    :
                    <TouchableOpacity
                        style={styles.bottomSheetHeadClose}
                        hitSlop={{ left: 10, top: 10, right: 20, bottom: 10 }}
                        onPress={() => {
                            this.hideBottomSheet();
                        }}>
                        <Text style={styles.bottomSheetHeadCloseText}>{I18n.t('close')}</Text>
                    </TouchableOpacity>
                }

                {this.state.isPhotoLimited && <View style={{
                    width: width, height: 54, backgroundColor: '#121212', marginTop: 10,
                    justifyContent: 'space-between', alignItems: 'center', flexDirection: 'row'
                }}>
                    <Text style={{ fontSize: 14, color: '#A8A8A8', marginStart: 11 }}>{I18n.t('camera_jurisdictions')}</Text>
                    <Pressable onPress={() => {
                        openSettings();
                    }}>
                        <Text style={{ fontSize: 14, color: '#FFFFFF', height: 54, lineHeight: 54, paddingStart: 10, paddingEnd: 12 }}>{I18n.t('canera_to_setting')}</Text>
                    </Pressable>

                </View>}
            </View>)
    }

    PhotoView = () => {
        return (
            <View style={[styles.photoView, { height: this.props.openPhotos ? height : 0 }]}>
                <ScrollBottomSheet
                    testID='action-sheet'
                    ref={(ref) => (this.bottomSheetRef = ref)}
                    innerRef={(ref) => (this.bottomSheetInnerRef = ref)}
                    componentType="FlatList"
                    //snapPoints 是组件距离屏幕顶部的距离
                    snapPoints={[0, height]}
                    //初始显示对应 snapPoints 中的下标
                    initialSnapIndex={1}
                    data={[]}
                    keyExtractor={(item, index) => {
                        return index
                    }}
                    friction={0.8}
                    numColumns={1}
                    initialNumToRender={1}
                    // refreshing={this.state.bottomSheetRefreshing}
                    enableOverScroll={true}
                    containerStyle={styles.contentContainerStyle}
                    contentContainerStyle={styles.contentContainerStyle}
                    onSettle={(index) => {
                        if (index === 1) {
                            this.hideBottomSheet();
                            this.props.onCloseView();
                        }
                    }}
                    renderHandle={() => this.PhotoHandleView()}
                    ListEmptyComponent={() => {
                        return (
                            <AVkitPhotoView {...this.props}
                                style={{ width, height, backgroundColor: 'black' }}
                                multiSelect={false}
                                onSelectedPhotoCallback={this.clickItemCallback}
                            ></AVkitPhotoView>
                        )
                    }}
                >
                </ScrollBottomSheet>
            </View>
        )
    }


    render() {
        return (
            <View style={[styles.container, { height: this.props.openPhotos ? height : 0 }]}>
                {this.PhotoView()}
            </View >
        );
    }

}

const styles = StyleSheet.create({
    container: {
        width: '100%', height: '100%', position: 'absolute', zIndex: 999, //backgroundColor: 'red',
    },
    btnContainer: {
        position: 'absolute', left: 20, bottom: 0, width: 25, height: 25, borderRadius: 4, overflow: 'hidden'
    },

    photoView: {
        flex: 1,
        width: width,
        zIndex: 1,
    },
    contentContainerStyle: {
        backgroundColor: '#000',
        justifyContent: 'space-between',
    },
    bottomSheetHead: {
        width: "100%",
        height: 120,
        backgroundColor: 'black',
        alignItems: 'flex-end',
        justifyContent: 'center',
    },

    bottomSheetHeadClose: {
        width: 52,
        lineHeight: 52,
        height: 28,
        marginRight: 15,
        borderRadius: 14,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },

    bottomSheetHeadCloseText: {
        color: 'rgba(0,0,0,0.8)',
        fontSize: 14,
    },

    bottomSheetItem: {
        width: photoItemWidth,
        height: photoItemHeight,
        marginBottom: 1,
        position: 'relative',
    },


    bottonSheetItemVideoTime: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        lineHeight: 17,
        fontSize: 12,
        color: 'rgba(255,255,255,1)',
        textShadowColor: 'rgba(0,0,0,0.5)',

    }

});

export default StoryPhoto
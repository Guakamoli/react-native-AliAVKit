
import React from 'react';
import { NativeModules } from 'react-native';
const { AliAVServiceBridge } = NativeModules;

export default class AVService {
  static async getFacePasterInfos({}) {
    return await AliAVServiceBridge.getFacePasterInfos({});
  }
  // {sourcePth:"",resourceType:"photo/video"}
  static async saveResourceToPhotoLibrary({ sourcePath, resourceType }) {
    return await AliAVServiceBridge.saveResourceToPhotoLibrary({ resourcePath, resourceType });
  }

  /*
{
  source:"",
  cropOffsetX:0.0,
  cropOffsetY:0.0,
  cropWidth:100.0,
  cropHeight:100.0,
  quality:'highest',//lowest/medium/highest/640x480/960x540/1280x720/1920x1080
}
*/
  static async crop({ source, cropOffsetX, cropOffsetY, cropWidth, cropHeight, quality }) {
    console.log('11111',source, cropOffsetX, cropOffsetY, cropWidth, cropHeight, quality);
    
    return await AliAVServiceBridge.crop({ source, cropOffsetX, cropOffsetY, cropWidth, cropHeight, quality });
  }
  //path ph://02C321FF-5B7B-4C3F-83E3-3D66BD9EDD78/L0/001
  static async saveToSandBox({ path }) {
    return await AliAVServiceBridge.saveToSandBox({ path });
  }
}
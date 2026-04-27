#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(LiquidSpiritWidget, NSObject)
RCT_EXTERN_METHOD(updateNextEvent:(NSDictionary *)payload
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(clear:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
@end

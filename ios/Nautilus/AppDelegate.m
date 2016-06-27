
#import "AppDelegate.h"

@interface AppDelegate ()

@end

@implementation AppDelegate


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    // Override point for customization after application launch.
    
    NSDictionary *infoDict = [[NSBundle mainBundle] infoDictionary];
    
    NSString *appVersion = [infoDict objectForKey:@"CFBundleShortVersionString"]; // example: 1.0.0
    NSString *buildNumber = [infoDict objectForKey:@"CFBundleVersion"];
    NSString* version =  [NSString stringWithFormat: @"%@.%@", appVersion, buildNumber];

    NSString* useragent = [NSString stringWithFormat: @"Nautilus /%@", version];
    
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];

    [defaults setObject:version forKey:@"version"];

    NSDictionary *dictionary = [NSDictionary dictionaryWithObjectsAndKeys:useragent, @"UserAgent", nil];
    [[NSUserDefaults standardUserDefaults] registerDefaults:dictionary];

    return YES;
}

- (void)applicationWillResignActive:(UIApplication *)application {
    // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
    // Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
    [[NSNotificationCenter defaultCenter] postNotificationName:@"onBackground" object:nil];
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
    // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
    // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
    // Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background'
    if ( [[NSUserDefaults standardUserDefaults] boolForKey:@"stayAwake"] ) {
        [[UIApplication sharedApplication] setIdleTimerDisabled: YES];
    } else {
        [[UIApplication sharedApplication] setIdleTimerDisabled: NO];
    }
    [[NSNotificationCenter defaultCenter] postNotificationName:@"onForeground" object:nil];
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
    // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
}

- (void)applicationWillTerminate:(UIApplication *)application {
    // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
}

@end

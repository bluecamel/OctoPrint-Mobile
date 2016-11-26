
#import "ViewController.h"

@interface ViewController ()

@end

@implementation ViewController

bool webapp_loaded = NO;
bool need_setup = NO;
int RETRY = 6;
int RETRY_INTERVAL = 10; //seconds

- (void)viewDidLoad
{
    [super viewDidLoad];
    
    self.webView.frame = [[UIScreen mainScreen] bounds];
    [self.webView setOpaque:NO];

    UIGraphicsBeginImageContext(self.webView.frame.size);
    [[UIImage imageNamed:@"www/loading.png"] drawInRect:self.webView.bounds];
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    
    self.webView.backgroundColor = [UIColor colorWithPatternImage:image ];

    //register notifications for open/close
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onForeground:) name:@"onForeground" object: nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onBackground:) name:@"onBackground" object: nil];

    [self checkWebApp:RETRY];
}

- (void) checkWebApp:(int) retryCounter
{
    if (retryCounter == 0) {
        return;
    }
    retryCounter--;

    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSString *url = [defaults stringForKey:@"serverURL"];
    NSString *apikey = [[defaults stringForKey:@"apikey"] stringByTrimmingCharactersInSet:
                               [NSCharacterSet whitespaceCharacterSet]];
    need_setup = NO;

    if ( [apikey length] == 0 || [url length] == 0 ) {
        
        need_setup = YES;
        
        [self showMessage: @"Before you can use this application, the \"Nautilus\" plugin needs to be installed on OctoPrint and you need to setup the OctoPrint server URL and the API KEY in the settings of this app.<br/><br/>(shake to load the app settings)"];
        
    } else {
        
        if (![url hasSuffix:@"/"] ) {
            url = [NSString stringWithFormat: @"%@/", url];
        }
        
        [[NSURLCache sharedURLCache] removeAllCachedResponses];
        
        NSString *check_url = [NSString stringWithFormat: @"%@plugin/nautilus/static/img/appicon.png", url];
        
        NSURLSessionConfiguration *nocacheConfiguration = [NSURLSessionConfiguration ephemeralSessionConfiguration];
        nocacheConfiguration.requestCachePolicy = NSURLRequestReloadRevalidatingCacheData;
        nocacheConfiguration.timeoutIntervalForRequest = 15.0;
        nocacheConfiguration.timeoutIntervalForResource = 60.0;

        __weak __typeof(self)weakSelf = self;
        
        NSURLSession *session = [NSURLSession sessionWithConfiguration:nocacheConfiguration];
        
        [[session dataTaskWithURL:[NSURL URLWithString:check_url]
                completionHandler:^(NSData *data,
                                    NSURLResponse *response,
                                    NSError *error) {
                    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse*)response;
                    if (error) {
                        webapp_loaded = NO;
                        [self showMessage: error.localizedDescription];
                        [NSThread sleepForTimeInterval:RETRY_INTERVAL];
                        [weakSelf checkWebApp: retryCounter];
                    } else if ([httpResponse statusCode] == 404) { //file not found
                            webapp_loaded = NO;
                            [self showMessage: @"This application requires the plugin \"Nautilus\" installed on a running instance of OctoPrint." ];
                    } else if ([httpResponse statusCode] == 503 || [httpResponse statusCode] == 502) { //service error
                        webapp_loaded = NO;
                        if (retryCounter == 0) {
                            [self showMessage: @"I give up. OctoPrint is currently not running. You can wait a while longer, then shake to retry." ];
                        } else {
                            [self showMessage: @"OctoPrint is currently not running. Will retry in a few seconds." ];
                        }
                        [NSThread sleepForTimeInterval:RETRY_INTERVAL];
                        [weakSelf checkWebApp: retryCounter];

                        } else if ([httpResponse statusCode] == 200 ) {
                            //call back to main thread
                            dispatch_async(dispatch_get_main_queue(), ^{
                                [self loadWebApp:url apikey:apikey];
                            });
                            } else { // huh ?
                                webapp_loaded = NO;
                                [NSThread sleepForTimeInterval:RETRY_INTERVAL];
                                [weakSelf checkWebApp: retryCounter];
                            }
                }] resume];
            [session finishTasksAndInvalidate];
    }

}

-(void)loadWebApp:(NSString*)url apikey:(NSString*)apikey
{
    if (webapp_loaded) {
        [self.webView reload];
    } else {
        NSMutableURLRequest* request = [[NSMutableURLRequest alloc] initWithURL:[NSURL URLWithString:url] cachePolicy:NSURLRequestReloadIgnoringLocalAndRemoteCacheData timeoutInterval:20];
        [request addValue:apikey forHTTPHeaderField:@"API_KEY"];
        [self.webView loadRequest:request];
        webapp_loaded = YES;
    }
}

-(void)showMessage:(NSString*) message {
    NSURL *local_url = [NSURL fileURLWithPath:[[NSBundle mainBundle] pathForResource:@"message" ofType:@"html" inDirectory:@"www"]] ;
    NSString *URLString = [local_url absoluteString];
    NSString *queryString = [NSString stringWithFormat: @"?%@",  [message stringByAddingPercentEncodingWithAllowedCharacters :[NSCharacterSet URLHostAllowedCharacterSet]]];
    NSString *URLwithQueryString = [URLString stringByAppendingString: queryString];
    NSURL *finalURL = [NSURL URLWithString: URLwithQueryString];
    [self.webView loadRequest:[NSURLRequest requestWithURL:finalURL]];
}

-(void)onForeground:(NSNotification*) notification
{
    if ( webapp_loaded ) {
        [self.webView stringByEvaluatingJavaScriptFromString:@"onForeground()"];
    }
}

-(void)onBackground:(NSNotification*) notification
{
    if ( webapp_loaded ) {
        [self.webView stringByEvaluatingJavaScriptFromString:@"onBackground();"];
        [self.webView.scrollView zoomToRect:[[UIScreen mainScreen] bounds] animated:YES];
        self.webView.scrollView.zoomScale = 1.0;
    }
}

-(void)viewDidUnload
{
    [[NSNotificationCenter defaultCenter] removeObserver:self name:@"onForeground" object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:@"onBackground" object:nil];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
}

- (BOOL)canBecomeFirstResponder {
    return YES;
}

- (void)motionBegan:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
    if (motion == UIEventSubtypeMotionShake) {
        if (need_setup) {
            [[UIApplication sharedApplication] openURL:[NSURL URLWithString:UIApplicationOpenSettingsURLString]];
        } else {
            [self checkWebApp:RETRY];
            
            CABasicAnimation *animation = [CABasicAnimation animationWithKeyPath:@"transform.rotation"];
            [animation setToValue:[NSNumber numberWithFloat:-0.04f]];
            [animation setFromValue:[NSNumber numberWithFloat:0.04f]];
            [animation setDuration:0.05];
            [animation setRepeatCount:6];
            [animation setAutoreverses:YES];
            [[self.webView layer] addAnimation:animation forKey:nil];
        }
    }
}

@end

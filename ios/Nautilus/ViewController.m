
#import "ViewController.h"

@interface ViewController ()

@end

@implementation ViewController

bool load_webapp = NO;

- (void)viewDidLoad
{
    [super viewDidLoad];
    
    //register notifications for open/close
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onForeground:) name:@"onForeground" object: nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onBackground:) name:@"onBackground" object: nil];
    
    [self loadWebView];
}

- (void) loadWebView
{
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSString *url = [defaults stringForKey:@"serverURL"];
    NSString *apikey = [defaults stringForKey:@"apikey"];
    load_webapp = NO;
    
    if ( [apikey length] == 0 || [url length] == 0 ) {
        
        [self showMessage: @"Please setup the server URL and the API KEY."];
        
        [[UIApplication sharedApplication] openURL:[NSURL URLWithString:UIApplicationOpenSettingsURLString]];
        
    } else {

        if (![url hasSuffix:@"/"] ) {
            url = [NSString stringWithFormat: @"%@/", url];
        }
        
        NSString *check_url = [NSString stringWithFormat: @"%@plugin/nautilus/static/img/appicon.png", url];

        NSURLSessionConfiguration *nocacheConfiguration = [NSURLSessionConfiguration defaultSessionConfiguration];
        nocacheConfiguration.requestCachePolicy = NSURLRequestReloadIgnoringLocalCacheData;
        
        NSURLSession *session = [NSURLSession sessionWithConfiguration:nocacheConfiguration];
        
        [[session dataTaskWithURL:[NSURL URLWithString:check_url]
                completionHandler:^(NSData *data,
                                    NSURLResponse *response,
                                    NSError *error) {
                    NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse*)response;

                    if (error) {
                        [self showMessage: error.localizedDescription];
                    } else if ([httpResponse statusCode] == 200) {
                            load_webapp = YES;
                            NSString *webapp_url = [NSString stringWithFormat: @"%@?apikey=%@", url, apikey];
                            [self.webView loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:webapp_url]]];
                        } else {
                            [self showMessage: @"This application requires the plugin \"Nautilus\" to be installed on OctoPrint." ];
                        }
                }] resume];
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
    if ( load_webapp ) {
        NSString* javaScript =  @"onForeground()";
        self.webView.scrollView.zoomScale = 1.0f;
        [self.webView stringByEvaluatingJavaScriptFromString:javaScript];
    } else {
        [self loadWebView];
    }
}

-(void)onBackground:(NSNotification*) notification
{
    if ( load_webapp ) {
        NSString* javaScript = @"onBackground();";
        [self.webView stringByEvaluatingJavaScriptFromString:javaScript];
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
       [self loadWebView];
    }
}

@end

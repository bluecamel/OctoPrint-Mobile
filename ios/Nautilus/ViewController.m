
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
    
    self.webView.frame = [[UIScreen mainScreen] bounds];
    [self.webView setOpaque:NO];

    UIGraphicsBeginImageContext(self.webView.frame.size);
    [[UIImage imageNamed:@"www/loading.png"] drawInRect:self.webView.bounds];
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    
    self.webView.backgroundColor = [UIColor colorWithPatternImage:image ];
    
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
                    } else if ([httpResponse statusCode] == 404) {
                            [self showMessage: @"This application requires the plugin \"Nautilus\" to be installed on OctoPrint." ];
                    } else if ([httpResponse statusCode] == 503 || [httpResponse statusCode] == 502) {
                        [self showMessage: @"OctoPrint is currently not running. If you just started up your printer, please wait a couple of seconds, then try again. (shake your device)" ];
                        } else {
                            load_webapp = YES;
                            NSMutableURLRequest* request = [[NSMutableURLRequest alloc] initWithURL:[NSURL URLWithString:url] cachePolicy:NSURLRequestReloadIgnoringLocalCacheData timeoutInterval:10.0];
                            [request addValue:apikey forHTTPHeaderField:@"API_KEY"];
                            [self.webView loadRequest:request];
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
        [self.webView stringByEvaluatingJavaScriptFromString:@"onForeground()"];
    } else {
        [self loadWebView];
    }
}

-(void)onBackground:(NSNotification*) notification
{
    if ( load_webapp ) {
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
        [self loadWebView];
        
        CABasicAnimation *animation = [CABasicAnimation animationWithKeyPath:@"transform.rotation"];
        [animation setToValue:[NSNumber numberWithFloat:-0.04f]];
        [animation setFromValue:[NSNumber numberWithFloat:0.04f]];
        [animation setDuration:0.05];
        [animation setRepeatCount:6];
        [animation setAutoreverses:YES];
        [[self.webView layer] addAnimation:animation forKey:nil];
    }
}

@end

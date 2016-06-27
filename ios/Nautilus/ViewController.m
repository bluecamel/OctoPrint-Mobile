
#import "ViewController.h"

@interface ViewController ()

@end

@implementation ViewController

bool settings = NO;

- (void) loadWebView
{
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSString *url = [defaults stringForKey:@"serverURL"];
    NSString *apikey = [defaults stringForKey:@"apikey"];

    if ( [apikey length] == 0 || [url length] == 0 ) {
        settings = NO;
        
        NSURL *local_url = [NSURL fileURLWithPath:[[NSBundle mainBundle] pathForResource:@"warning" ofType:@"html" inDirectory:@"www"]];
        //NSLog(@"local_url: %@", local_url);
        [self.webView loadRequest:[NSURLRequest requestWithURL:local_url]];
        
        [[UIApplication sharedApplication] openURL:[NSURL URLWithString:UIApplicationOpenSettingsURLString]];
    } else {
        settings = YES;

        if (![url hasSuffix:@"/"] ) {
            url = [NSString stringWithFormat: @"%@/", url];
        }

        NSString *goto_url = [NSString stringWithFormat: @"%@?apikey=%@", url, apikey];
        //NSLog(@"URL %@", goto_url);
        [self.webView loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:goto_url]]];
    }

}

- (void)viewDidLoad
{
    [super viewDidLoad];
    
    //register notifications for open/close
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onForeground:) name:@"onForeground" object: nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(onBackground:) name:@"onBackground" object: nil];
    
    [self loadWebView];
}


-(void)onForeground:(NSNotification*) notification
{
    NSString* javaScript =  @"onForeground()";
    //NSLog(@"octopi: %@", javaScript);
    if ( settings ) {
        //NSLog(@"zooming: %f", self.webView.scrollView.zoomScale);
        self.webView.scrollView.zoomScale = 1.0f;
        //NSLog(@"zooming: %f", self.webView.scrollView.zoomScale);
        [self.webView stringByEvaluatingJavaScriptFromString:javaScript];
    } else {
        [self loadWebView];
    }
}

-(void)onBackground:(NSNotification*) notification
{
    NSString* javaScript = @"onBackground();";
    //NSLog(@"octopi: %@", javaScript);
    [self.webView stringByEvaluatingJavaScriptFromString:javaScript];
}


-(void)viewDidUnload
{
    [[NSNotificationCenter defaultCenter] removeObserver:self name:@"onForeground" object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:@"onBackground" object:nil];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (BOOL)canBecomeFirstResponder {
    return YES;
}

- (void)motionBegan:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
    if (motion == UIEventSubtypeMotionShake) {
       [self.webView reload];
    }
}

@end

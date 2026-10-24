package pl.mojpingwinek.demo;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
public class MainActivity extends Activity {
 WebView view;
 @Override public void onCreate(Bundle b){super.onCreate(b);view=new WebView(this);view.getSettings().setJavaScriptEnabled(true);setContentView(view);view.loadUrl("file:///android_asset/index.html");}
 @Override protected void onDestroy(){view.destroy();super.onDestroy();}
}

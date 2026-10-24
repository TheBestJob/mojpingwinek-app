package pl.mojpingwinek.demo;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;
public class MainActivity extends Activity {
 private WebView view;
 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  view = new WebView(this);
  WebSettings settings = view.getSettings();
  settings.setJavaScriptEnabled(true);
  settings.setDomStorageEnabled(true);
  settings.setAllowFileAccess(true);
  setContentView(view);
  view.loadUrl("file:///android_asset/index.html");
 }
 @Override protected void onDestroy() {
  if (view != null) { view.destroy(); view = null; }
  super.onDestroy();
 }
}

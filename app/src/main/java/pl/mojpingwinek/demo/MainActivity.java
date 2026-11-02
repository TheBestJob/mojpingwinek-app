package pl.mojpingwinek.demo;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.DownloadListener;
import android.webkit.ValueCallback;
import android.webkit.WebResourceRequest;
import android.webkit.CookieManager;
import android.widget.Toast;

public class MainActivity extends Activity {
 private WebView view;
 private ValueCallback<Uri[]> fileCallback;
 private static final int FILE_PICKER = 119;
 private static final String START_URL = "https://thebestjob.github.io/mojpingwinek-app/v5.html";

 @Override public void onCreate(Bundle savedInstanceState) {
  super.onCreate(savedInstanceState);
  view = new WebView(this);
  WebSettings settings = view.getSettings();
  settings.setJavaScriptEnabled(true);
  settings.setDomStorageEnabled(true);
  settings.setAllowFileAccess(false);
  settings.setAllowContentAccess(true);
  settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  CookieManager.getInstance().setAcceptCookie(true);
  view.setWebViewClient(new WebViewClient() {
   @Override public boolean shouldOverrideUrlLoading(WebView webView, WebResourceRequest request) {
    Uri uri = request.getUrl();
    if ("thebestjob.github.io".equals(uri.getHost()) && "https".equals(uri.getScheme())) return false;
    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); } catch(Exception ignored) {}
    return true;
   }
  });
  view.setWebChromeClient(new WebChromeClient() {
   @Override public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> callback, FileChooserParams params) {
    if (fileCallback != null) fileCallback.onReceiveValue(null);
    fileCallback = callback;
    try { startActivityForResult(params.createIntent(), FILE_PICKER); return true; }
    catch(Exception e) { fileCallback = null; return false; }
   }
  });
  view.setDownloadListener((url, userAgent, contentDisposition, mimeType, length) -> {
   // Blobs generated in the hosted app are not directly downloadable via Android DownloadManager.
   // Keep the browser as the supported route for retrieving cloud files during testing.
   Toast.makeText(this, "Pobieranie dokumentów: użyj wersji przeglądarkowej.", Toast.LENGTH_LONG).show();
  });
  setContentView(view);
  view.loadUrl(START_URL);
 }

 @Override protected void onActivityResult(int requestCode,int resultCode,Intent data) {
  super.onActivityResult(requestCode,resultCode,data);
  if (requestCode==FILE_PICKER && fileCallback!=null) {
   fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode,data));
   fileCallback=null;
  }
 }
 @Override public void onBackPressed() {
  if (view != null && view.canGoBack()) view.goBack();
  else super.onBackPressed();
 }
 @Override protected void onDestroy() {
  if (fileCallback != null) { fileCallback.onReceiveValue(null); fileCallback=null; }
  if (view != null) { view.destroy(); view=null; }
  super.onDestroy();
 }
}

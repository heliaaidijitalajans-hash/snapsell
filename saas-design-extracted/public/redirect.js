(function () {
  var port = window.location.port;
  var p = window.location.pathname;
  var mainPort = "3006";
  if (port === "5173") {
    var target = "http://localhost:" + mainPort + "/dashboard";
    if (p.indexOf("editor") !== -1) target = "http://localhost:" + mainPort + "/dashboard/editor";
    else if (p.indexOf("kutuphane") !== -1) target = "http://localhost:" + mainPort + "/dashboard/kutuphane";
    else if (p.indexOf("hesap-ayarlari") !== -1) target = "http://localhost:" + mainPort + "/dashboard/hesap-ayarlari";
    document.open();
    document.write(
      "<!DOCTYPE html><html><head><meta charset=\"UTF-8\">" +
        "<meta http-equiv=\"refresh\" content=\"0;url=" + target + "\">" +
        "<title>Yonlendiriliyor</title></head><body>" +
        "<p>Yonlendiriliyor... <a href=\"" + target + "\">Tiklayin</a></p></body></html>"
    );
    document.close();
    return;
  }
})();
export {};

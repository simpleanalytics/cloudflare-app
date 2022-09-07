(function saAutomatedEvents(window) {
  // Skip server side rendered pages
  if (typeof window === "undefined") return;

  var options = {
    // What to collect
    outbound:
      typeof INSTALL_OPTIONS.events_outbound === "boolean"
        ? INSTALL_OPTIONS.events_outbound
        : true,
    emails:
      typeof INSTALL_OPTIONS.events_emails === "boolean"
        ? INSTALL_OPTIONS.events_emails
        : true,
    downloads:
      typeof INSTALL_OPTIONS.events_downloads === "boolean"
        ? INSTALL_OPTIONS.events_downloads
        : true,

    // Downloads: enter file extensions you want to collect
    downloadsExtensions:
      typeof INSTALL_OPTIONS.download_extensions === "string"
        ? INSTALL_OPTIONS.download_extensions
            .split(",")
            .map(function (extension) {
              return extension.replace(/(^\.)/, "").trim();
            })
            .filter(function (extension) {
              return extension;
            })
        : ["pdf", "csv", "docx", "xlsx"],

    // All: use title attribute if set for event name (for all events)
    // THIS TAKES PRECEDENCE OVER OTHER SETTINGS BELOW
    title:
      typeof INSTALL_OPTIONS.events_use_title === "boolean"
        ? INSTALL_OPTIONS.events_use_title
        : true,
    // Outbound: use full URL of the links? false for just the hostname
    outboundFullUrl:
      typeof INSTALL_OPTIONS.outbound_full_url === "boolean"
        ? INSTALL_OPTIONS.outbound_full_url
        : false,
    // Downloads: if taking event name from URL, use full URL or just filename (default)
    downloadsFullUrl:
      typeof INSTALL_OPTIONS.downloads_full_url === "boolean"
        ? INSTALL_OPTIONS.downloads_full_url
        : false,
  };

  var log = function (message, type) {
    var logger = type === "warn" ? console.warn : console.log;
    return logger("Simple Analytics automated events: " + message);
  };

  // For minifying the script
  var optionsLink = options;

  if (typeof optionsLink === "undefined")
    log("options object not found, please specify", "warn");

  window.saAutomatedLink = function saAutomatedLink(element, type) {
    try {
      if (!element) return log("no element found");
      var sent = false;

      var callback = function () {
        if (!sent && !element.hasAttribute("target"))
          document.location = element.getAttribute("href");
        sent = true;
      };

      if (window.sa_event) {
        var hostname = element.hostname;
        var pathname = element.pathname;
        var useTitle = false;
        if (optionsLink.title && element.hasAttribute("title")) {
          var theTitle = element.getAttribute("title").trim();
          if (theTitle != "") useTitle = true;
        }

        var event;

        if (useTitle) {
          event = theTitle;
        } else {
          switch (type) {
            case "outbound": {
              event = hostname + (optionsLink.outboundFullUrl ? pathname : "");
              break;
            }
            case "download": {
              event = optionsLink.downloadsFullUrl
                ? hostname + pathname
                : pathname.split("/").pop();
              break;
            }
            case "email": {
              var href = element.getAttribute("href");
              event = (href.split(":")[1] || "").split("?")[0];
              break;
            }
          }
        }

        var clean =
          type +
          "_" +
          event.replace(/[^a-z0-9]+/gi, "_").replace(/(^_+|_+$)/g, "");

        sa_event(clean, callback);

        log("collected " + clean);

        return window.setTimeout(callback, 5000);
      } else {
        log("sa_event is not defined", "warn");
        return callback();
      }
    } catch (error) {
      log(error.message, "warn");
    }
  };

  function onDOMContentLoaded() {
    try {
      var a = document.getElementsByTagName("a");

      // Loop over all links on the page
      for (var i = 0; i < a.length; i++) {
        var link = a[i];

        // We don't want to overwrite website behaviour so we check for the onclick attribute
        if (!link.getAttribute("onclick")) {
          var collect;

          // Collect download clicks
          if (
            optionsLink.downloads &&
            /^https?:\/\//i.test(link.href) &&
            new RegExp(
              ".(" + (optionsLink.downloadsExtensions || []).join("|") + ")",
              "i"
            ).test(link.pathname)
          ) {
            collect = "download";

            // Collect outbound links clicks
          } else if (
            optionsLink.outbound &&
            /^https?:\/\//i.test(link.href) &&
            link.hostname !== window.location.hostname
          ) {
            collect = "outbound";

            // Collect email clicks
          } else if (optionsLink.emails && /^mailto:/i.test(link.href)) {
            collect = "email";
          }

          if (collect)
            var onClickAttribute = "saAutomatedLink(this, '" + collect + "');";

          if (
            !link.hasAttribute("target") ||
            link.hasAttribute("target") === "_self"
          )
            onClickAttribute += " return false;";

          link.setAttribute("onclick", onClickAttribute);
        }
      }
    } catch (error) {
      log(error.message, "warn");
    }
  }

  window.addEventListener("DOMContentLoaded", onDOMContentLoaded);
})(window);

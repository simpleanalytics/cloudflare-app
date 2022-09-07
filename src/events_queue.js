var SaFunctionName = INSTALL_OPTIONS.namespace
  ? INSTALL_OPTIONS.namespace + "_event"
  : "sa_event";

window[SaFunctionName] =
  window[SaFunctionName] ||
  function () {
    a = [].slice.call(arguments);
    window[SaFunctionName].q
      ? window[SaFunctionName].q.push(a)
      : (window[SaFunctionName].q = [a]);
  };

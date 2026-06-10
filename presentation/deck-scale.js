// Letterbox-scale the fixed 1920×1080 slide to any viewport.
(function () {
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    var slides = document.querySelectorAll('.slide');
    for (var i = 0; i < slides.length; i++) {
      slides[i].style.transform = 'translate(-50%, -50%) scale(' + s + ')';
    }
  }
  window.addEventListener('resize', fit);
  fit();
})();

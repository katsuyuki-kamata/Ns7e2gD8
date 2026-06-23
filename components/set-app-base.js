/**
 * このファイルは必ず <head> 先頭付近で、他の相対パスより前に同期読み込みすること。
 * document.currentScript からプロジェクトルート（components の親）を求め、<base href> を挿入する。
 * file:// でも http(s):// でも、HTML の置き場所が変わっても「ルート基準のパス」だけで資産を解決できる。
 */
(function () {
  var sc = document.currentScript;
  if (!sc || !sc.src) return;
  var root = new URL('..', sc.src).href;
  if (!/\/$/.test(root)) root += '/';
  document.write('<base href="' + root.replace(/"/g, '&quot;') + '">');
})();

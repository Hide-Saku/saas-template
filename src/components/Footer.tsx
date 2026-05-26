/**
 * Footer — 仕様書 §3 の 4 列構造 (サービス / サポート / 法的情報 / サイト情報)
 *
 * § 5-C: 「学習データはこのブラウザに保存されています」と小さく明記。
 */

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          {/* サービス */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3">
              サービス
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <a href="/quiz/" className="hover:text-teal-600 dark:hover:text-teal-400">
                  問題演習
                </a>
              </li>
              <li>
                <a href="/exam/" className="hover:text-teal-600 dark:hover:text-teal-400">
                  模試
                </a>
              </li>
              <li>
                <a href="/glossary/" className="hover:text-teal-600 dark:hover:text-teal-400">
                  用語集
                </a>
              </li>
              <li>
                <a href="/listen/" className="hover:text-teal-600 dark:hover:text-teal-400">
                  聞き流し
                </a>
              </li>
              <li>
                <a href="/pricing/" className="hover:text-teal-600 dark:hover:text-teal-400">
                  料金プラン
                </a>
              </li>
            </ul>
          </div>

          {/* サポート */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3">
              サポート
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <a href="/contact/" className="hover:text-teal-600 dark:hover:text-teal-400">
                  お問い合わせ
                </a>
              </li>
              <li>
                <a href="/mypage/" className="hover:text-teal-600 dark:hover:text-teal-400">
                  マイページ
                </a>
              </li>
              <li>
                <a href="/account/" className="hover:text-teal-600 dark:hover:text-teal-400">
                  アカウント
                </a>
              </li>
            </ul>
          </div>

          {/* 法的情報 */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3">
              法的情報
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <a href="/legal/privacy/" className="hover:text-teal-600 dark:hover:text-teal-400">
                  プライバシーポリシー
                </a>
              </li>
              <li>
                <a href="/legal/terms/" className="hover:text-teal-600 dark:hover:text-teal-400">
                  利用規約
                </a>
              </li>
              <li>
                <a href="/legal/tokushoho/" className="hover:text-teal-600 dark:hover:text-teal-400">
                  特定商取引法に基づく表記
                </a>
              </li>
            </ul>
          </div>

          {/* サイト情報 */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-3">
              サイト情報
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {/* TODO: テンプレ利用側でサービス固有の注記に置換 */}
              本サービスは{"{{SITE_NAME}}"}が独立して提供する{"{{CERT_NAME}}"}対策教材です。{"{{OFFICIAL_BODY}}"}等の公式サービスではありません。{"{{SYLLABUS_VERSION}}"}に基づき独自に作成しています。
            </p>
            {/* § 5-C 静的注記 */}
            <p className="mt-3 text-[10px] text-slate-400 dark:text-slate-500">
              ※ 学習データはこのブラウザに保存されます
            </p>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} {"{{SITE_NAME}}"}
        </div>
      </div>
    </footer>
  );
}

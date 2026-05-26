#!/usr/bin/env node
/**
 * KV バックアップスクリプト
 *
 * 用途: AUTH_SESSIONS namespace 内の全エントリを JSON ファイルとして取得し、
 *       バックアップディレクトリに保存する (月次手動実行を想定)。
 *
 * 出力先: backups/kv-YYYY-MM-DD.json (gitignore 済)
 *
 * 使い方:
 *   node scripts/backup-kv.mjs
 *
 * 前提:
 *   - wrangler CLI が利用可能 (`npx wrangler --version` でバージョン確認)
 *   - wrangler.jsonc の kv_namespaces に AUTH_SESSIONS が登録済
 *
 * 注意:
 *   - paid_email:{email} は個人情報を含む。バックアップファイルは厳重に管理
 *   - 取得は順次実行 (KV API 制限のため一括取得不可)
 *   - 環境変数 CLOUDFLARE_ACCOUNT_ID と CLOUDFLARE_API_TOKEN は wrangler が
 *     ~/.wrangler/config から自動取得 (wrangler login 済みの前提)
 */

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BACKUP_DIR = join(ROOT, "backups");
const NAMESPACE_BINDING = "AUTH_SESSIONS";

function timestamp() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf-8" });
}

function main() {
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

  console.log("[backup-kv] KV バックアップを開始します...");
  console.log(`[backup-kv] バインディング: ${NAMESPACE_BINDING}`);

  // 1. キー一覧を取得
  console.log("[backup-kv] キー一覧を取得中...");
  const listOutput = sh(
    `npx wrangler kv key list --binding ${NAMESPACE_BINDING} --remote`,
  );
  let keys;
  try {
    keys = JSON.parse(listOutput);
  } catch (e) {
    console.error("[backup-kv] キー一覧のパースに失敗:", e);
    console.error("出力:", listOutput);
    process.exit(1);
  }

  console.log(`[backup-kv] ${keys.length} 件のキーを発見`);

  // 2. 各キーの値を取得
  const backup = {
    backedUpAt: new Date().toISOString(),
    namespace: NAMESPACE_BINDING,
    keyCount: keys.length,
    entries: {},
  };

  let done = 0;
  for (const k of keys) {
    try {
      const value = sh(
        `npx wrangler kv key get "${k.name}" --binding ${NAMESPACE_BINDING} --remote --text`,
      ).trim();
      backup.entries[k.name] = {
        value,
        expiration: k.expiration ?? null,
      };
      done++;
      if (done % 10 === 0) {
        console.log(`[backup-kv]   ${done}/${keys.length} 件完了...`);
      }
    } catch (e) {
      console.warn(`[backup-kv]   キー取得失敗: ${k.name}`, e.message);
    }
  }

  // 3. ファイルに書き出し
  const outPath = join(BACKUP_DIR, `kv-${timestamp()}.json`);
  writeFileSync(outPath, JSON.stringify(backup, null, 2));

  console.log(`[backup-kv] ✅ 完了: ${outPath}`);
  console.log(`[backup-kv]    バックアップサイズ: ${(JSON.stringify(backup).length / 1024).toFixed(1)} KB`);
  console.log(`[backup-kv]    エントリ数: ${done}/${keys.length}`);
}

try {
  main();
} catch (e) {
  console.error("[backup-kv] エラー:", e);
  process.exit(1);
}

# Demo sandbox

Open `https://mail-attachment-archive.sociobot.in/?demo=1` or select **Try it
with sample data** on the first screen. The desktop app also offers **Load
sample archive** before a real archive is opened.

The sample represents someone leaving a work account. It contains three
messages and four attachment references: a closing statement, a photo stored
once for two message references, and a damaged contract reference retained in
the verification report. Use the visible **Export CSV** or **Export JSON** control
to download the complete sample evidence. The source fixture is
`public/samples/leaving-account.mbox`; the complete sample manifest is embedded
from `src/demo.ts` so the demo needs no server or account.

The web demo writes only `demo:mail-attachment-archive:state` in localStorage.
It never reads or writes the real license or recent-archive keys. **Reset demo**
removes and recreates that one sample key and restores all filters. **Start for
real** removes it before returning to the download section. The desktop sample
is in memory and writes no files or preferences.

Run every declared claim from a clean state using the exact commands in
`.factory/claims.json`.

const html = `<ul>
<li class='li-folder'><img class='folder-icon' src='/icons/diagrams.svg'><a name='Diagrams/'>Diagrams</a>
<ul>
<li><a href='...'>item</a></li>
</ul>
</li>
</ul>`;

const liFolderRegex = /<li\s[^>]*class=['"][^'"]*li-folder[^'"]*['"][^>]*>([\s\S]*?)<\/li>/gi;
let m;
while ((m = liFolderRegex.exec(html)) !== null) {
  console.log('Match content:', m[1]);
  const aInLi = /<a\s+([^>]*)>([\s\S]*?)<\/a>/i.exec(m[1]);
  if (!aInLi) { console.log('no A'); continue; }
  console.log('A attrs:', aInLi[1]);
  if (/href=['"][^'"]*['"]/i.test(aInLi[1])) { console.log('has href'); continue; }
  console.log('NAME:', decodeURIComponent(aInLi[2].replace(/<[^>]*>?/igm, '').trim()));
}

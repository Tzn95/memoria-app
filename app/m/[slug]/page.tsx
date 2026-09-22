import { supabase } from '../../../lib/supabase'

function fmt(d?:string|null){if(!d)return '';return new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(d+'T00:00:00Z'))}

export default async function Memorial({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params
 const {data:m,error}=await supabase.from('memorials').select('*').eq('slug',slug).eq('status','published').single()
 if(error||!m) return <main className="notfound"><div><div className="brand">MEMORIA</div><h1>Memoriale non disponibile</h1><p>La pagina richiesta non è pubblicata o non esiste.</p></div></main>
 const [{data:timeline},{data:media},{data:dedications}]=await Promise.all([
  supabase.from('timeline_events').select('*').eq('memorial_id',m.id).order('sort_order'),
  supabase.from('media').select('*').eq('memorial_id',m.id).order('sort_order'),
  supabase.from('dedications').select('*').eq('memorial_id',m.id).eq('status','approved').order('created_at',{ascending:false})
 ])
 const fullName=`${m.first_name||''} ${m.last_name||''}`.trim()
 return <>
  <header className="header"><div className="wrap headerInner"><a className="brand" href="/">MEMORIA</a><nav><a href="#biografia">Biografia</a><a href="#galleria">Galleria</a><a href="#vita">La sua vita</a><a href="#riposo">Luogo di riposo</a></nav></div></header>
  <section className="hero" style={m.main_photo_url?{backgroundImage:`linear-gradient(90deg,rgba(17,20,22,.82),rgba(17,20,22,.35)),url(${m.main_photo_url})`}:undefined}><div className="wrap heroInner"><p className="eyebrow">IN MEMORIA DI</p><h1>{fullName}</h1><p className="dates">{fmt(m.birth_date)}{m.birth_date&&m.death_date?' — ':''}{fmt(m.death_date)}</p>{m.dedication&&<blockquote>“{m.dedication}”</blockquote>}</div></section>
  <main>
   <section id="biografia" className="section wrap bio"><div><p className="eyebrow darkText">IL SUO RICORDO</p><h2>Biografia</h2>{m.short_intro&&<p className="lead">{m.short_intro}</p>}<p className="bodyText">{m.biography}</p></div><div className="portrait">{m.main_photo_url?<img src={m.main_photo_url} alt={`Ritratto di ${fullName}`}/>:<span>Foto principale</span>}</div></section>
   <section id="galleria" className="section soft"><div className="wrap"><p className="eyebrow darkText">MOMENTI PREZIOSI</p><h2>Galleria multimediale</h2>{media&&media.length>0?<div className="gallery">{media.map((x:any)=><figure key={x.id}>{x.media_type==='video'?<video controls src={x.file_url}/>:<img src={x.file_url} alt={x.caption||`Ricordo di ${fullName}`}/>} {x.caption&&<figcaption>{x.caption}</figcaption>}</figure>)}</div>:<div className="emptyState">Le fotografie del memoriale verranno raccolte qui.</div>}</div></section>
   <section id="vita" className="section wrap"><p className="eyebrow darkText">UNA VITA DA RICORDARE</p><h2>La vita di {m.first_name}</h2><div className="timeline">{timeline&&timeline.length>0?timeline.map((x:any)=><article key={x.id}><div className="dot"/><div className="year">{x.year_text||fmt(x.event_date)}</div><h3>{x.title}</h3>{x.description&&<p>{x.description}</p>}</article>):<p>Nessun evento della vita è stato ancora aggiunto.</p>}</div></section>
   <section className="section soft"><div className="wrap"><p className="eyebrow darkText">PAROLE CHE RESTANO</p><h2>Condoglianze, Dediche e Ricordi</h2>{dedications&&dedications.length>0?<div className="dedications">{dedications.slice(0,6).map((d:any)=><blockquote className="dedication" key={d.id}>“{d.message}”<cite>{d.author_name||'Anonimo'}</cite></blockquote>)}</div>:<div className="emptyState">Le dediche approvate appariranno qui.</div>}<div className="dedicationForm"><h3>Lascia una dedica</h3><p>Le dediche vengono pubblicate dopo l'approvazione della famiglia.</p><form action={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/dedications`} method="post"><input name="author_name" placeholder="Il tuo nome"/><textarea name="message" required placeholder="Scrivi un pensiero, un ricordo o una dedica…"/><button type="button" disabled>Invio dediche: prossimo aggiornamento</button></form></div></div></section>
   <section id="riposo" className="rest"><div className="wrap restGrid"><div><p className="eyebrow">IL LUOGO DEL RICORDO</p><h2>Luogo di Riposo</h2><p className="restName">{m.cemetery_name}</p><p>{m.cemetery_address}</p><div className="grave"><span>Sezione <b>{m.cemetery_section||'—'}</b></span><span>Fila <b>{m.cemetery_row||'—'}</b></span><span>Tomba <b>{m.cemetery_spot||'—'}</b></span></div>{m.maps_url&&<a className="btn" href={m.maps_url} target="_blank" rel="noreferrer">Apri mappa e indicazioni</a>}</div><div className="mapCard"><span>Mappa e indicazioni</span></div></div></section>
  </main>
  <footer><div className="wrap"><div className="brand light">MEMORIA</div><p>Un luogo digitale per custodire una storia, nel tempo.</p></div></footer>
 </>
}

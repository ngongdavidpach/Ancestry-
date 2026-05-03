// src/pages/AncestryPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { listenToMembers, addMember, updateMember, deleteMember, getCommunity, uploadPhoto, logActivity } from '../lib/db'
import LoadingScreen from '../components/LoadingScreen'

// ── Constants ─────────────────────────────────────────────────
const CLANS = [
  'Dinka Rek','Dinka Twic','Dinka Bor','Dinka Ngok','Dinka Malwal',
  'Nuer Lou','Nuer Gawaar','Nuer Bul','Nuer Dok',
  'Zande','Bari','Acholi','Madi','Lotuko','Murle','Shilluk',
  'Mundari','Toposa','Didinga','Kakwa','Lugbara','Other'
]

// ── Shared styles ─────────────────────────────────────────────
const inputCss = {
  width:'100%', padding:'11px 15px', fontSize:15, borderRadius:10,
  marginBottom:16, background:'rgba(8,5,3,0.9)',
  border:'1px solid rgba(193,127,62,0.22)', color:'var(--text)',
}
const labelCss = {
  display:'block', fontSize:11, color:'var(--gold)',
  fontFamily:'var(--font-display)', letterSpacing:'0.1em', marginBottom:7,
}
const btnPrimary = {
  background:'linear-gradient(135deg,#6B4428,#C17F3E)', border:'none',
  color:'#F5ECD7', borderRadius:10, fontFamily:'var(--font-display)',
  fontSize:11, fontWeight:700, letterSpacing:'0.08em', cursor:'pointer',
}

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ member, size=48 }) {
  const initials = (member.name||'?').split(' ').slice(0,2).map(n=>n[0]).join('')
  const colors = member.gender==='female' ? ['#8B5E3C','#C17F3E'] : ['#2C4A3E','#3D6B5C']
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', flexShrink:0, overflow:'hidden',
      background:`linear-gradient(135deg,${colors[0]},${colors[1]})`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.33, fontWeight:700, color:'#F5ECD7',
      fontFamily:'var(--font-display)',
      border:'2px solid rgba(193,127,62,0.35)',
    }}>
      {member.photoURL
        ? <img src={member.photoURL} alt={member.name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        : initials}
    </div>
  )
}

// ── Modal wrapper ─────────────────────────────────────────────
function Modal({ title, children, onClose, wide=false }) {
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(3,2,1,0.92)', zIndex:300,
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{
        background:'linear-gradient(160deg,#0F0A05,#1A1008)',
        border:'1px solid rgba(193,127,62,0.3)', borderRadius:18,
        width:'100%', maxWidth:wide?760:640, maxHeight:'92vh',
        overflow:'hidden', display:'flex', flexDirection:'column',
        boxShadow:'0 40px 100px rgba(0,0,0,0.85)',
      }}>
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'18px 26px', borderBottom:'1px solid var(--border)',
          background:'rgba(193,127,62,0.04)', flexShrink:0,
        }}>
          <h3 style={{fontFamily:'var(--font-display)', fontSize:13, color:'var(--gold)', letterSpacing:'0.12em'}}>{title}</h3>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:22,lineHeight:1}}>×</button>
        </div>
        <div style={{padding:'26px', overflowY:'auto', flex:1}}>{children}</div>
      </div>
    </div>
  )
}

// ── Member Form ───────────────────────────────────────────────
function MemberForm({ initial, allMembers, communityId, onSave, onCancel, isAdmin }) {
  const { user } = useAuth()
  const fileRef = useRef()
  const [form, setForm] = useState(initial || {
    name:'', gender:'male', birthYear:'', deathYear:'',
    birthPlace:'', clan:'', parentIds:[], spouseIds:[], childrenIds:[],
    biography:'', photoURL:null, occupation:'', generation:'',
  })
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(initial?.photoURL||null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handlePhoto = e => {
    const file = e.target.files[0]; if(!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const toggle = (field, id) =>
    setForm(f=>({...f,[field]:f[field].includes(id)?f[field].filter(x=>x!==id):[...f[field],id]}))

  const handleSave = async () => {
    if(!form.name.trim()) return setError('Name is required.')
    setSaving(true); setError('')
    try {
      let photoURL = form.photoURL
      if(photoFile) {
        const memberId = initial?.id || `temp-${Date.now()}`
        photoURL = await uploadPhoto(photoFile, memberId, communityId)
      }
      await onSave({ ...form, photoURL, communityId, updatedBy: user.uid })
    } catch(e) { setError(e.message) }
    setSaving(false)
  }

  const others = allMembers.filter(m=>m.id!==form.id)

  const RelationPicker = ({ field, color='var(--gold)' }) => (
    <div style={{display:'flex',flexWrap:'wrap',gap:8,maxHeight:140,overflowY:'auto',padding:'4px 0'}}>
      {others.map(m=>(
        <button key={m.id} onClick={()=>toggle(field,m.id)} style={{
          background:form[field].includes(m.id)?`rgba(193,127,62,0.2)`:'rgba(8,5,3,0.7)',
          border:`1px solid ${form[field].includes(m.id)?color:'rgba(193,127,62,0.18)'}`,
          color:form[field].includes(m.id)?'var(--text)':'var(--text-dim)',
          borderRadius:6, padding:'5px 12px', fontSize:13, fontFamily:'var(--font-body)',
          cursor:'pointer', transition:'all 0.15s',
        }}>{m.name}</button>
      ))}
      {others.length===0 && <span style={{color:'var(--text-dim)',fontSize:13,fontStyle:'italic'}}>No other members yet.</span>}
    </div>
  )

  return (
    <div>
      {error&&<div style={{background:'rgba(180,60,60,0.12)',border:'1px solid rgba(180,60,60,0.3)',borderRadius:8,padding:'10px 14px',color:'#E06060',marginBottom:16,fontSize:13}}>⚠ {error}</div>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div style={{gridColumn:'1/-1'}}>
          <label style={labelCss}>FULL NAME *</label>
          <input style={inputCss} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Deng Majok Kuol"/>
        </div>
        <div>
          <label style={labelCss}>GENDER</label>
          <select style={inputCss} value={form.gender} onChange={e=>set('gender',e.target.value)}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label style={labelCss}>CLAN</label>
          <select style={inputCss} value={form.clan} onChange={e=>set('clan',e.target.value)}>
            <option value="">Select clan...</option>
            {CLANS.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelCss}>BIRTH YEAR</label>
          <input style={inputCss} value={form.birthYear} onChange={e=>set('birthYear',e.target.value)} placeholder="e.g. 1950"/>
        </div>
        <div>
          <label style={labelCss}>DEATH YEAR (if deceased)</label>
          <input style={inputCss} value={form.deathYear} onChange={e=>set('deathYear',e.target.value)} placeholder="Leave blank if living"/>
        </div>
        <div>
          <label style={labelCss}>BIRTH PLACE</label>
          <input style={inputCss} value={form.birthPlace} onChange={e=>set('birthPlace',e.target.value)} placeholder="e.g. Bahr el Ghazal"/>
        </div>
        <div>
          <label style={labelCss}>OCCUPATION</label>
          <input style={inputCss} value={form.occupation} onChange={e=>set('occupation',e.target.value)} placeholder="e.g. Elder, Teacher, Farmer"/>
        </div>
        <div style={{gridColumn:'1/-1'}}>
          <label style={labelCss}>BIOGRAPHY & LIFE STORY</label>
          <textarea style={{...inputCss,minHeight:110,resize:'vertical',lineHeight:1.7}}
            value={form.biography} onChange={e=>set('biography',e.target.value)}
            placeholder="Describe this person's life, achievements, role in the community, notable events..."/>
        </div>
      </div>

      {/* Photo */}
      <div style={{marginBottom:20}}>
        <label style={labelCss}>PORTRAIT PHOTO</label>
        <div style={{display:'flex',gap:14,alignItems:'center'}}>
          {photoPreview&&<img src={photoPreview} alt="" style={{width:60,height:60,borderRadius:'50%',objectFit:'cover',border:'2px solid rgba(193,127,62,0.4)'}}/>}
          <button onClick={()=>fileRef.current.click()} style={{...btnPrimary,padding:'8px 18px',fontSize:11}}>
            {photoPreview?'CHANGE PHOTO':'UPLOAD PHOTO'}
          </button>
          {photoPreview&&<button onClick={()=>{setPhotoPreview(null);setPhotoFile(null);set('photoURL',null)}} style={{background:'transparent',border:'none',color:'var(--text-dim)',fontSize:12,cursor:'pointer'}}>Remove</button>}
          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePhoto}/>
        </div>
      </div>

      {/* Relations */}
      {others.length>0&&(
        <>
          <div style={{marginBottom:20}}>
            <label style={labelCss}>PARENTS</label>
            <RelationPicker field="parentIds"/>
          </div>
          <div style={{marginBottom:20}}>
            <label style={labelCss}>SPOUSES</label>
            <RelationPicker field="spouseIds" color="#C17F3E"/>
          </div>
          <div style={{marginBottom:24}}>
            <label style={labelCss}>CHILDREN</label>
            <RelationPicker field="childrenIds" color="var(--green)"/>
          </div>
        </>
      )}

      <div style={{display:'flex',gap:12,justifyContent:'flex-end',paddingTop:8,borderTop:'1px solid var(--border)'}}>
        <button onClick={onCancel} style={{padding:'10px 22px',background:'transparent',border:'1px solid var(--border)',color:'var(--text-dim)',borderRadius:10,fontSize:11,letterSpacing:'0.06em'}}>CANCEL</button>
        <button onClick={handleSave} disabled={saving} style={{...btnPrimary,padding:'10px 28px',opacity:saving?0.7:1}}>
          {saving?'SAVING...':'SAVE RECORD'}
        </button>
      </div>
    </div>
  )
}

// ── Profile View ──────────────────────────────────────────────
function ProfileView({ member, allMembers, onEdit, onDelete, onClose, isAdmin }) {
  const parents = (member.parentIds||[]).map(id=>allMembers.find(m=>m.id===id)).filter(Boolean)
  const spouses = (member.spouseIds||[]).map(id=>allMembers.find(m=>m.id===id)).filter(Boolean)
  const children = (member.childrenIds||[]).map(id=>allMembers.find(m=>m.id===id)).filter(Boolean)

  const handlePrint = () => {
    const win = window.open('','_blank')
    win.document.write(`<!DOCTYPE html><html><head><title>${member.name}</title>
    <style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;color:#1a1008;background:#fdf8f0}
    h1{font-size:26px;margin-bottom:4px}.clan{color:#8B5E3C;font-size:16px;margin-bottom:14px}
    .meta{display:flex;gap:24px;flex-wrap:wrap;font-size:14px;color:#444;margin-bottom:20px}
    h3{font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#8B5E3C;border-bottom:1px solid #C17F3E;padding-bottom:4px;margin:20px 0 10px}
    .bio{line-height:1.8;font-size:16px}.relations li{padding:4px 0;border-bottom:1px solid #e8d8c0;font-size:14px;list-style:none}
    footer{margin-top:40px;font-size:11px;color:#888;border-top:1px solid #ccc;padding-top:12px}
    img{width:90px;height:90px;border-radius:50%;object-fit:cover;float:right;border:3px solid #C17F3E}
    </style></head><body>
    ${member.photoURL?`<img src="${member.photoURL}" alt=""/>`:''}
    <h1>${member.name}${member.deathYear?' †':''}</h1>
    <div class="clan">${member.clan||''}</div>
    <div class="meta">
      ${member.birthYear?`<span>Born: ${member.birthYear}${member.birthPlace?`, ${member.birthPlace}`:''}</span>`:''}
      ${member.deathYear?`<span>Died: ${member.deathYear}</span>`:'<span style="color:#2a6a4a">Living</span>'}
      ${member.occupation?`<span>Occupation: ${member.occupation}</span>`:''}
    </div>
    ${member.biography?`<h3>Biography</h3><p class="bio">${member.biography}</p>`:''}
    ${parents.length?`<h3>Parents</h3><ul class="relations">${parents.map(p=>`<li>${p.name}${p.clan?` — ${p.clan}`:''}</li>`).join('')}</ul>`:''}
    ${spouses.length?`<h3>Spouses</h3><ul class="relations">${spouses.map(s=>`<li>${s.name}${s.clan?` — ${s.clan}`:''}</li>`).join('')}</ul>`:''}
    ${children.length?`<h3>Children</h3><ul class="relations">${children.map(c=>`<li>${c.name}${c.clan?` — ${c.clan}`:''}</li>`).join('')}</ul>`:''}
    <footer>Exported from Ancestry Records System · ${new Date().toLocaleDateString()}</footer>
    </body></html>`)
    win.document.close(); win.print()
  }

  const Relation = ({ person }) => (
    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
      <Avatar member={person} size={30}/>
      <div>
        <div style={{fontSize:14,color:'var(--text)',fontFamily:'var(--font-body)'}}>{person.name}</div>
        {person.clan&&<div style={{fontSize:11,color:'var(--gold)'}}>{person.clan}</div>}
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{display:'flex',gap:20,alignItems:'flex-start',marginBottom:20,paddingBottom:20,borderBottom:'1px solid var(--border)'}}>
        <Avatar member={member} size={84}/>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
            <h2 style={{fontFamily:'var(--font-display)',fontSize:22,color:'var(--text)',margin:0}}>{member.name}</h2>
            {member.deathYear&&<span style={{fontSize:20,color:'var(--text-dim)'}}>†</span>}
          </div>
          {member.clan&&<div style={{color:'var(--gold)',fontSize:15,marginBottom:6,fontFamily:'var(--font-body)'}}>{member.clan}</div>}
          <div style={{display:'flex',flexWrap:'wrap',gap:14,fontSize:13,color:'var(--text-muted)',fontFamily:'var(--font-body)'}}>
            {member.birthYear&&<span>🗓 {member.birthYear}{member.birthPlace?` · ${member.birthPlace}`:''}</span>}
            {member.deathYear&&<span>† {member.deathYear}</span>}
            {!member.deathYear&&member.birthYear&&<span style={{color:'var(--green)'}}>● Living</span>}
            {member.occupation&&<span>⚒ {member.occupation}</span>}
          </div>
        </div>
      </div>

      {member.biography&&(
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:'var(--gold)',fontFamily:'var(--font-display)',letterSpacing:'0.1em',marginBottom:10}}>BIOGRAPHY</div>
          <p style={{color:'#C8B89A',fontFamily:'var(--font-body)',fontSize:16,lineHeight:1.8,margin:0}}>{member.biography}</p>
        </div>
      )}

      {(parents.length||spouses.length||children.length)>0&&(
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:20,marginBottom:20}}>
          {parents.length>0&&(
            <div>
              <div style={{fontSize:11,color:'var(--gold)',fontFamily:'var(--font-display)',letterSpacing:'0.1em',marginBottom:12}}>PARENTS</div>
              {parents.map(p=><Relation key={p.id} person={p}/>)}
            </div>
          )}
          {spouses.length>0&&(
            <div>
              <div style={{fontSize:11,color:'var(--gold)',fontFamily:'var(--font-display)',letterSpacing:'0.1em',marginBottom:12}}>SPOUSES</div>
              {spouses.map(s=><Relation key={s.id} person={s}/>)}
            </div>
          )}
          {children.length>0&&(
            <div>
              <div style={{fontSize:11,color:'var(--gold)',fontFamily:'var(--font-display)',letterSpacing:'0.1em',marginBottom:12}}>CHILDREN</div>
              {children.map(c=><Relation key={c.id} person={c}/>)}
            </div>
          )}
        </div>
      )}

      <div style={{display:'flex',gap:10,flexWrap:'wrap',paddingTop:16,borderTop:'1px solid var(--border)'}}>
        <button onClick={handlePrint} style={{...btnPrimary,padding:'9px 18px',background:'rgba(61,107,92,0.2)',border:'1px solid rgba(61,107,92,0.4)',color:'var(--green)'}}>🖨 EXPORT / PRINT</button>
        {isAdmin&&(
          <>
            <button onClick={()=>onEdit(member)} style={{...btnPrimary,padding:'9px 18px',background:'rgba(193,127,62,0.15)',border:'1px solid rgba(193,127,62,0.4)',color:'var(--gold)'}}>✏ EDIT</button>
            <button onClick={()=>{if(confirm(`Delete ${member.name}?`)){onDelete();onClose()}}} style={{...btnPrimary,padding:'9px 18px',background:'rgba(180,60,60,0.1)',border:'1px solid rgba(180,60,60,0.3)',color:'var(--red)',marginLeft:'auto'}}>🗑 DELETE</button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Tree Node ─────────────────────────────────────────────────
function TreeNode({ member, allMembers, onSelect, level=0, visited=new Set() }) {
  if(visited.has(member.id)) return null
  visited.add(member.id)
  const children = (member.childrenIds||[]).map(id=>allMembers.find(m=>m.id===id)).filter(Boolean)
  const spouses = (member.spouseIds||[]).map(id=>allMembers.find(m=>m.id===id)).filter(Boolean)

  const nodeStyle = {
    background:'rgba(14,10,6,0.92)',
    border:`1px solid ${level===0?'var(--gold)':'rgba(193,127,62,0.35)'}`,
    borderRadius:10, padding:'10px 14px', cursor:'pointer', minWidth:150, maxWidth:190,
    transition:'all 0.2s',
  }

  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
      <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
          <div style={nodeStyle} onClick={()=>onSelect(member)}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.boxShadow='0 4px 20px rgba(193,127,62,0.2)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=level===0?'var(--gold)':'rgba(193,127,62,0.35)';e.currentTarget.style.boxShadow='none'}}
          >
            <Avatar member={member} size={34}/>
            <div style={{fontFamily:'var(--font-display)',fontSize:12,color:'var(--text)',marginTop:6,fontWeight:700,lineHeight:1.3}}>{member.name}</div>
            {member.clan&&<div style={{fontSize:10,color:'var(--gold)',marginTop:2,fontFamily:'var(--font-body)'}}>{member.clan}</div>}
            {member.birthYear&&<div style={{fontSize:10,color:'var(--text-dim)',marginTop:2,fontFamily:'var(--font-mono)'}}>{member.birthYear}{member.deathYear?` – ${member.deathYear}`:''}</div>}
          </div>
          {spouses.map(sp=>(
            <div key={sp.id} style={{display:'flex',alignItems:'center',gap:6,marginTop:8}}>
              <div style={{width:20,height:1,background:'rgba(193,127,62,0.3)'}}/>
              <span style={{fontSize:10,color:'var(--gold)'}}>♥</span>
              <div style={{width:20,height:1,background:'rgba(193,127,62,0.3)'}}/>
              <div onClick={()=>onSelect(sp)} style={{...nodeStyle,minWidth:120,maxWidth:150,cursor:'pointer'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='var(--gold)'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(193,127,62,0.35)'}
              >
                <div style={{fontSize:11,fontFamily:'var(--font-display)',color:'var(--text)',fontWeight:700}}>{sp.name}</div>
                {sp.clan&&<div style={{fontSize:9,color:'var(--gold)',fontFamily:'var(--font-body)'}}>{sp.clan}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
      {children.length>0&&(
        <>
          <div style={{width:1,height:22,background:'rgba(193,127,62,0.25)'}}/>
          <div style={{display:'flex',gap:14,position:'relative',alignItems:'flex-start'}}>
            {children.length>1&&<div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',height:1,background:'rgba(193,127,62,0.2)',width:'calc(100% - 60px)'}}/>}
            {children.map(child=>(
              <div key={child.id} style={{display:'flex',flexDirection:'column',alignItems:'center'}}>
                <div style={{width:1,height:16,background:'rgba(193,127,62,0.25)'}}/>
                <TreeNode member={child} allMembers={allMembers} onSelect={onSelect} level={level+1} visited={new Set(visited)}/>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function AncestryPage() {
  const { communityId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [community, setCommunity] = useState(null)
  const [members, setMembers] = useState([])
  const [loadingCommunity, setLoadingCommunity] = useState(true)
  const [view, setView] = useState('directory')
  const [search, setSearch] = useState('')
  const [filterClan, setFilterClan] = useState('')
  const [filterGender, setFilterGender] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [modal, setModal] = useState(null) // 'add' | 'edit' | 'profile'
  const [activeMember, setActiveMember] = useState(null)
  const [treeRoot, setTreeRoot] = useState(null)

  const isAdmin = community?.adminIds?.includes(user.uid) || community?.createdBy === user.uid

  useEffect(() => {
    getCommunity(communityId).then(c => { setCommunity(c); setLoadingCommunity(false) })
    const unsub = listenToMembers(communityId, setMembers)
    return unsub
  }, [communityId])

  const handleSaveMember = async (data) => {
    if(activeMember?.id) {
      await updateMember(activeMember.id, data)
      await logActivity(communityId, user.uid, 'update', `Updated ${data.name}`)
    } else {
      await addMember({ ...data, communityId })
      await logActivity(communityId, user.uid, 'add', `Added ${data.name}`)
    }
    setModal(null); setActiveMember(null)
  }

  const handleDeleteMember = async (id) => {
    const m = members.find(x=>x.id===id)
    await deleteMember(id, members)
    await logActivity(communityId, user.uid, 'delete', `Deleted ${m?.name}`)
  }

  const openProfile = (m) => { setActiveMember(m); setModal('profile') }
  const openEdit = (m) => { setActiveMember(m); setModal('edit') }
  const openAdd = () => { setActiveMember(null); setModal('add') }
  const closeModal = () => { setModal(null); setActiveMember(null) }

  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    return (
      (!q || m.name?.toLowerCase().includes(q) || (m.clan||'').toLowerCase().includes(q) || (m.biography||'').toLowerCase().includes(q) || (m.birthPlace||'').toLowerCase().includes(q)) &&
      (!filterClan || m.clan===filterClan) &&
      (!filterGender || m.gender===filterGender) &&
      (!filterStatus || (filterStatus==='living'?!m.deathYear:!!m.deathYear))
    )
  })

  const roots = members.filter(m=>!m.parentIds||m.parentIds.length===0)
  const treeSubject = treeRoot ? members.find(m=>m.id===treeRoot) : roots[0]
  const usedClans = [...new Set(members.map(m=>m.clan).filter(Boolean))]
  const clanStats = usedClans.map(c=>({clan:c,count:members.filter(m=>m.clan===c).length})).sort((a,b)=>b.count-a.count)

  if(loadingCommunity) return <LoadingScreen message="Loading community..."/>

  const navTabs = [
    {id:'directory',label:'Directory',icon:'👥'},
    {id:'tree',label:'Family Tree',icon:'🌳'},
    {id:'stats',label:'Overview',icon:'📊'},
  ]

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(160deg,#080503 0%,#0D0804 60%,#080503 100%)'}}>
      {/* Nav */}
      <nav style={{borderBottom:'1px solid rgba(193,127,62,0.15)',background:'rgba(8,5,3,0.96)',backdropFilter:'blur(20px)',padding:'0 24px',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',maxWidth:1200,margin:'0 auto',height:62,gap:12,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <button onClick={()=>navigate('/')} style={{background:'none',border:'none',color:'var(--text-dim)',fontSize:20,cursor:'pointer',padding:4,lineHeight:1}} title="Back">←</button>
            <div>
              <div style={{fontFamily:'var(--font-display)',fontSize:14,fontWeight:900,color:'var(--gold)',letterSpacing:'0.1em'}}>{community?.name||'Community'}</div>
              <div style={{fontSize:10,color:'var(--text-dim)'}}>{community?.region||''} {community?.clanGroup?`· ${community.clanGroup}`:''}</div>
            </div>
          </div>
          <div style={{display:'flex',gap:4}}>
            {navTabs.map(t=>(
              <button key={t.id} onClick={()=>setView(t.id)} style={{
                background:view===t.id?'rgba(193,127,62,0.15)':'transparent',
                border:`1px solid ${view===t.id?'rgba(193,127,62,0.4)':'transparent'}`,
                color:view===t.id?'var(--gold)':'var(--text-dim)',
                borderRadius:8, padding:'6px 14px', fontSize:11,
                letterSpacing:'0.06em', transition:'all 0.2s',
              }}>
                <span style={{marginRight:6}}>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
          {isAdmin&&(
            <button onClick={openAdd} style={{...btnPrimary,padding:'9px 20px',fontSize:11,letterSpacing:'0.08em',boxShadow:'0 4px 20px rgba(193,127,62,0.25)'}}>+ ADD MEMBER</button>
          )}
        </div>
      </nav>

      <div style={{maxWidth:1200,margin:'0 auto',padding:'32px 24px'}}>

        {/* DIRECTORY */}
        {view==='directory'&&(
          <div className="page-enter">
            <div style={{display:'flex',gap:10,marginBottom:26,flexWrap:'wrap'}}>
              <div style={{flex:'1 1 240px',position:'relative'}}>
                <span style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',color:'var(--text-dim)',fontSize:15}}>🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, clan, place, story..."
                  style={{...inputCss,paddingLeft:38,marginBottom:0,borderRadius:10}}/>
              </div>
              {[
                {val:filterClan,set:setFilterClan,opts:[['','All Clans'],...usedClans.map(c=>[c,c])]},
                {val:filterGender,set:setFilterGender,opts:[['','All Genders'],['male','Male'],['female','Female']]},
                {val:filterStatus,set:setFilterStatus,opts:[['','All'],['living','Living'],['deceased','Deceased']]},
              ].map((s,i)=>(
                <select key={i} value={s.val} onChange={e=>s.set(e.target.value)} style={{...inputCss,marginBottom:0,width:'auto',minWidth:130}}>
                  {s.opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}
                </select>
              ))}
              <div style={{display:'flex',alignItems:'center',fontSize:13,color:'var(--text-dim)',fontFamily:'var(--font-body)',whiteSpace:'nowrap'}}>
                {filtered.length}/{members.length} records
              </div>
            </div>
            {members.length===0?(
              <div style={{textAlign:'center',padding:'70px 20px',border:'1px dashed rgba(193,127,62,0.18)',borderRadius:16}}>
                <div style={{fontSize:48,marginBottom:16}}>🏺</div>
                <div style={{fontFamily:'var(--font-display)',fontSize:15,color:'var(--gold)',marginBottom:8,letterSpacing:'0.1em'}}>NO RECORDS YET</div>
                <p style={{color:'var(--text-dim)',fontStyle:'italic',marginBottom:24}}>Begin by adding the first family member to this lineage.</p>
                {isAdmin&&<button onClick={openAdd} style={{...btnPrimary,padding:'11px 28px'}}>+ ADD FIRST MEMBER</button>}
              </div>
            ):(
              <div style={{columns:'300px',gap:16}}>
                {filtered.map(m=>(
                  <div key={m.id} style={{breakInside:'avoid',marginBottom:16}}>
                    <MemberCard member={m} allMembers={members} onClick={openProfile}/>
                  </div>
                ))}
                {filtered.length===0&&<div style={{textAlign:'center',padding:'40px',color:'var(--text-dim)',fontStyle:'italic',fontSize:16}}>No records match your search.</div>}
              </div>
            )}
          </div>
        )}

        {/* TREE */}
        {view==='tree'&&(
          <div className="page-enter">
            <div style={{display:'flex',gap:12,marginBottom:20,alignItems:'center',flexWrap:'wrap'}}>
              <span style={{fontFamily:'var(--font-display)',fontSize:12,color:'var(--gold)',letterSpacing:'0.08em'}}>ROOT:</span>
              <select value={treeRoot||(roots[0]?.id||'')} onChange={e=>setTreeRoot(e.target.value)} style={{...inputCss,marginBottom:0,width:'auto',minWidth:200}}>
                {members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <span style={{fontSize:13,color:'var(--text-dim)',fontFamily:'var(--font-body)',fontStyle:'italic'}}>Pick any person as the tree root</span>
            </div>
            <div style={{
              overflowX:'auto', overflowY:'auto',
              border:'1px solid rgba(193,127,62,0.12)', borderRadius:16,
              background:'rgba(8,5,3,0.55)', padding:'40px 32px', minHeight:400,
              backgroundImage:'radial-gradient(circle at 1px 1px,rgba(193,127,62,0.055) 1px,transparent 0)',
              backgroundSize:'32px 32px',
            }}>
              {treeSubject
                ? <TreeNode member={treeSubject} allMembers={members} onSelect={openProfile}/>
                : <div style={{textAlign:'center',padding:'60px',color:'var(--text-dim)',fontStyle:'italic',fontSize:16}}>No members added yet.</div>
              }
            </div>
          </div>
        )}

        {/* STATS */}
        {view==='stats'&&(
          <div className="page-enter" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:20}}>
            {/* Counts */}
            <div style={{background:'rgba(10,8,5,0.85)',border:'1px solid var(--border)',borderRadius:14,padding:'24px'}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:12,color:'var(--gold)',letterSpacing:'0.1em',marginBottom:20}}>COMMUNITY OVERVIEW</div>
              {[
                {l:'Total Members',v:members.length,i:'👥'},
                {l:'Living',v:members.filter(m=>!m.deathYear).length,i:'●',c:'var(--green)'},
                {l:'Deceased',v:members.filter(m=>m.deathYear).length,i:'†',c:'var(--text-dim)'},
                {l:'Male',v:members.filter(m=>m.gender==='male').length,i:'♂'},
                {l:'Female',v:members.filter(m=>m.gender==='female').length,i:'♀'},
                {l:'Clans Represented',v:usedClans.length,i:'🏛'},
                {l:'With Biography',v:members.filter(m=>m.biography?.trim()).length,i:'📖'},
                {l:'With Photo',v:members.filter(m=>m.photoURL).length,i:'🖼'},
              ].map(s=>(
                <div key={s.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 0',borderBottom:'1px solid rgba(193,127,62,0.08)'}}>
                  <span style={{color:'var(--text-muted)',fontSize:14}}>{s.i} {s.l}</span>
                  <span style={{fontFamily:'var(--font-display)',fontSize:18,color:s.c||'var(--gold)',fontWeight:700}}>{s.v}</span>
                </div>
              ))}
            </div>
            {/* Clan breakdown */}
            <div style={{background:'rgba(10,8,5,0.85)',border:'1px solid var(--border)',borderRadius:14,padding:'24px'}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:12,color:'var(--gold)',letterSpacing:'0.1em',marginBottom:20}}>CLAN BREAKDOWN</div>
              {clanStats.length===0
                ? <div style={{color:'var(--text-dim)',fontStyle:'italic',fontSize:14}}>No clan data recorded yet.</div>
                : clanStats.map(c=>(
                  <div key={c.clan} style={{marginBottom:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                      <span style={{fontSize:14,color:'var(--text-muted)',fontFamily:'var(--font-body)'}}>{c.clan}</span>
                      <span style={{fontSize:12,color:'var(--gold)',fontFamily:'var(--font-mono)'}}>{c.count}</span>
                    </div>
                    <div style={{height:4,background:'rgba(193,127,62,0.08)',borderRadius:2}}>
                      <div style={{height:'100%',width:`${(c.count/members.length)*100}%`,background:'linear-gradient(90deg,#6B4428,#C17F3E)',borderRadius:2,transition:'width 0.5s'}}/>
                    </div>
                  </div>
                ))
              }
            </div>
            {/* Recent */}
            <div style={{background:'rgba(10,8,5,0.85)',border:'1px solid var(--border)',borderRadius:14,padding:'24px'}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:12,color:'var(--gold)',letterSpacing:'0.1em',marginBottom:20}}>RECENT ENTRIES</div>
              {[...members].slice(-8).reverse().map(m=>(
                <div key={m.id} onClick={()=>openProfile(m)} style={{display:'flex',gap:10,alignItems:'center',padding:'8px 0',borderBottom:'1px solid rgba(193,127,62,0.07)',cursor:'pointer',transition:'opacity 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.opacity='0.65'}
                  onMouseLeave={e=>e.currentTarget.style.opacity='1'}
                >
                  <Avatar member={m} size={32}/>
                  <div>
                    <div style={{fontSize:14,color:'var(--text)',fontFamily:'var(--font-body)'}}>{m.name}</div>
                    {m.clan&&<div style={{fontSize:11,color:'var(--gold)'}}>{m.clan}</div>}
                  </div>
                  {!m.deathYear&&<div style={{marginLeft:'auto',width:6,height:6,borderRadius:'50%',background:'var(--green)'}}/>}
                </div>
              ))}
              {members.length===0&&<div style={{color:'var(--text-dim)',fontStyle:'italic',fontSize:13}}>No members yet.</div>}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal==='add'&&(
        <Modal title="ADD NEW FAMILY MEMBER" onClose={closeModal} wide>
          <MemberForm initial={null} allMembers={members} communityId={communityId} onSave={handleSaveMember} onCancel={closeModal} isAdmin={isAdmin}/>
        </Modal>
      )}
      {modal==='edit'&&activeMember&&(
        <Modal title="EDIT MEMBER RECORD" onClose={closeModal} wide>
          <MemberForm initial={activeMember} allMembers={members} communityId={communityId} onSave={handleSaveMember} onCancel={closeModal} isAdmin={isAdmin}/>
        </Modal>
      )}
      {modal==='profile'&&activeMember&&(
        <Modal title="ANCESTRY PROFILE" onClose={closeModal} wide>
          <ProfileView
            member={activeMember} allMembers={members}
            onEdit={(m)=>{setActiveMember(m);setModal('edit')}}
            onDelete={()=>handleDeleteMember(activeMember.id)}
            onClose={closeModal} isAdmin={isAdmin}
          />
        </Modal>
      )}
    </div>
  )
}

// ── Member Card ───────────────────────────────────────────────
function MemberCard({ member, allMembers, onClick }) {
  const parents = (member.parentIds||[]).map(id=>allMembers.find(m=>m.id===id)).filter(Boolean)
  const children = (member.childrenIds||[]).map(id=>allMembers.find(m=>m.id===id)).filter(Boolean)
  const spouses = (member.spouseIds||[]).map(id=>allMembers.find(m=>m.id===id)).filter(Boolean)
  const alive = !member.deathYear
  const years = member.birthYear?(member.deathYear?`${member.birthYear} – ${member.deathYear}`:`b. ${member.birthYear}`):'';

  return (
    <div onClick={()=>onClick(member)} style={{
      background:'rgba(14,10,6,0.9)', border:'1px solid rgba(193,127,62,0.22)',
      borderRadius:12, padding:'16px 18px', cursor:'pointer',
      transition:'all 0.2s', position:'relative', overflow:'hidden',
    }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(193,127,62,0.7)';e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 8px 32px rgba(193,127,62,0.12)'}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(193,127,62,0.22)';e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}
    >
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:alive?'linear-gradient(90deg,var(--green),var(--gold))':'linear-gradient(90deg,#444,#666)'}}/>
      <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
        <Avatar member={member} size={50}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:14,fontWeight:700,color:'var(--text)',lineHeight:1.3,marginBottom:2}}>{member.name}</div>
          {member.clan&&<div style={{fontSize:11,color:'var(--gold)',marginBottom:3,fontFamily:'var(--font-body)',letterSpacing:'0.04em'}}>{member.clan}</div>}
          {years&&<div style={{fontSize:11,color:'var(--text-dim)',fontFamily:'var(--font-mono)'}}>{years}</div>}
          {member.occupation&&<div style={{fontSize:12,color:'var(--text-muted)',marginTop:3,fontFamily:'var(--font-body)'}}>{member.occupation}</div>}
          <div style={{display:'flex',gap:12,marginTop:8,flexWrap:'wrap'}}>
            {parents.length>0&&<span style={{fontSize:11,color:'var(--text-dim)',fontFamily:'var(--font-body)'}}>👤 {parents.length}p</span>}
            {spouses.length>0&&<span style={{fontSize:11,color:'var(--text-dim)',fontFamily:'var(--font-body)'}}>💑 {spouses.length}s</span>}
            {children.length>0&&<span style={{fontSize:11,color:'var(--text-dim)',fontFamily:'var(--font-body)'}}>👶 {children.length}c</span>}
            {member.biography&&<span style={{fontSize:11,color:'var(--text-dim)'}}>📖</span>}
            {member.photoURL&&<span style={{fontSize:11,color:'var(--text-dim)'}}>🖼</span>}
          </div>
        </div>
        {!alive&&<div style={{fontSize:16,color:'var(--text-dim)',flexShrink:0}}>†</div>}
      </div>
    </div>
  )
}

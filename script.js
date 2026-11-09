const state={selected:new Map()};
const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const money=n=>new Intl.NumberFormat('ru-RU').format(n)+' ₽';

function showPage(name){
  $$('.page').forEach(p=>p.classList.toggle('active',p.id===`page-${name}`));
  $$('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.page===name));
  if(name==='order') renderOrder();
  window.scrollTo({top:0,behavior:'smooth'});
}
$$('.nav-link').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
$('#hero-cta').addEventListener('click',()=>{showPage('services');});

$$('.filter').forEach(button=>button.addEventListener('click',()=>{
  $$('.filter').forEach(b=>b.classList.toggle('active',b===button));
  $$('.service-card').forEach(card=>{
    card.hidden=button.dataset.category!=='all'&&card.dataset.category!==button.dataset.category;
  });
}));

function renderOrder(){
  const list=$('#order-items');list.replaceChildren();
  const entries=[...state.selected.entries()];
  $('#cart-count').textContent=entries.length;
  $('#order-items-count').textContent=entries.length;
  if(!entries.length){
    const empty=document.createElement('p');empty.className='empty-state';empty.textContent='Пока ничего не выбрано. Загляни в каталог.';list.append(empty);
  }
  let total=0;
  entries.forEach(([id,item])=>{
    total+=item.price;
    const row=document.createElement('div');row.className='order-line';
    const title=document.createElement('span');title.textContent=item.name;
    const right=document.createElement('span');
    const price=document.createElement('strong');price.textContent=item.price?money(item.price):'По запросу';
    const remove=document.createElement('button');remove.className='remove-item';remove.type='button';remove.setAttribute('aria-label',`Удалить ${item.name}`);remove.textContent='×';
    remove.addEventListener('click',()=>{state.selected.delete(id);syncCards();renderOrder()});
    right.append(price,remove);row.append(title,right);list.append(row);
  });
  $('#order-total').textContent=money(total);
}
function syncCards(){
  $$('.service-card').forEach(card=>{
    const selected=state.selected.has(card.dataset.id);
    card.classList.toggle('selected',selected);
    $('.add-button',card).textContent=selected?'✓ Выбрано':'+ Добавить';
  });
  $('#cart-count').textContent=state.selected.size;
}
$$('.service-card').forEach(card=>$('.add-button',card).addEventListener('click',()=>{
  const id=card.dataset.id;
  if(state.selected.has(id))state.selected.delete(id);
  else state.selected.set(id,{name:card.dataset.name,price:Number(card.dataset.price)});
  syncCards();renderOrder();
}));

$('#order-form').addEventListener('submit',async event=>{
  event.preventDefault();
  const status=$('#form-status'),submit=$('.submit-button');
  if(!state.selected.size){status.textContent='Сначала добавь хотя бы одну услугу.';showPage('services');return;}
  const form=new FormData(event.currentTarget);
  const payload={
    name:String(form.get('name')||'').trim(),
    contact:String(form.get('contact')||'').trim(),
    comment:String(form.get('comment')||'').trim(),
    services:[...state.selected.values()],
  };
  if(!payload.name||!payload.contact){status.textContent='Укажи имя и контакт для связи.';return;}
  submit.disabled=true;submit.textContent='Отправляем…';status.textContent='';
  try{
    const response=await fetch('/api/order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const result=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(result.error||'Не удалось отправить заявку. Попробуй позже.');
    status.textContent='Заявка отправлена! Скоро свяжемся с тобой.';
    event.currentTarget.reset();state.selected.clear();syncCards();renderOrder();
  }catch(error){
    status.textContent=error.message||'Ошибка отправки. Напиши нам напрямую в Telegram.';
  }finally{
    submit.disabled=false;submit.innerHTML='Отправить заявку <span>↗</span>';
  }
});
renderOrder();

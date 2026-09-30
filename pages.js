document.querySelectorAll('.page-menu').forEach(button => button.addEventListener('click', () => {
  const nav = document.querySelector('.subpage .main-nav');
  const open = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
}));

document.querySelectorAll('.filter-row button').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.filter-row button').forEach(tab => tab.classList.toggle('active', tab === button));
  document.querySelectorAll('.page-product-card').forEach(card => {
    card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
  });
}));

const cartCountNodes = document.querySelectorAll('.cart-count');
const shoppingDialog = document.querySelector('.shopping-dialog');
const shoppingItemsNode = document.querySelector('.shopping-items');
const shoppingTotalNode = document.querySelector('.shopping-subtotal');
let shoppingBag = [];
try { shoppingBag = JSON.parse(localStorage.getItem('forma-demo-bag') || '[]'); } catch { shoppingBag = []; }
const formatPrice = amount => `₹${Number(amount).toLocaleString('en-IN')}`;
function saveShoppingBag() {
  try { localStorage.setItem('forma-demo-bag', JSON.stringify(shoppingBag)); } catch { /* demo can still run without storage */ }
  const count = shoppingBag.reduce((total, item) => total + item.quantity, 0);
  cartCountNodes.forEach(node => node.textContent = count);
  shoppingTotalNode?.replaceChildren(document.createTextNode(formatPrice(shoppingBag.reduce((total, item) => total + item.price * item.quantity, 0))));
  if (!shoppingItemsNode) return;
  if (!shoppingBag.length) {
    shoppingItemsNode.innerHTML = '<p class="shopping-empty">Your bag is empty for now.<br>Find a piece you love.</p>';
    return;
  }
  shoppingItemsNode.innerHTML = shoppingBag.map((item, index) => `<div class="shopping-line"><img src="${item.image}" alt=""><div><b>${item.name}</b><small>${formatPrice(item.price)} each</small><div class="shopping-quantity"><button type="button" data-quantity="minus" data-index="${index}" aria-label="Decrease ${item.name} quantity">−</button><span>${item.quantity}</span><button type="button" data-quantity="plus" data-index="${index}" aria-label="Increase ${item.name} quantity">+</button></div></div><span>${formatPrice(item.quantity * item.price)}</span><button type="button" data-remove-item="${index}" aria-label="Remove ${item.name}">×</button></div>`).join('');
  const checkoutButton = document.querySelector('.proceed-checkout');
  if (checkoutButton) checkoutButton.disabled = !shoppingBag.length;
}
function addShoppingItem(item) {
  const found = shoppingBag.find(existing => existing.id === item.id);
  if (found) found.quantity++;
  else shoppingBag.push({...item, quantity:1});
  saveShoppingBag();
}
saveShoppingBag();
document.querySelectorAll('.page-product-card').forEach(card => {
  const productLink = card.querySelector('a[href*="product.html"]');
  const id = new URL(productLink.href).searchParams.get('id');
  const name = card.querySelector('h2').textContent;
  const price = Number(card.querySelector('.page-product-meta span').textContent.replace(/[^0-9]/g, ''));
  const image = card.querySelector('img').getAttribute('src');
  const actions = document.createElement('div');
  actions.className = 'page-product-actions';
  actions.innerHTML = `<button class="add-to-bag" type="button">Add to Cart <span>＋</span></button><a class="explore-product" href="${productLink.getAttribute('href')}">Explore <span>↗</span></a>`;
  card.append(actions);
  actions.querySelector('.add-to-bag').addEventListener('click', event => {
    addShoppingItem({id, name, price, image});
    const button = event.currentTarget;
    button.innerHTML = 'Added <span>✓</span>';
    shoppingDialog?.showModal();
    window.setTimeout(() => { if (button.isConnected) button.innerHTML = 'Add to Cart <span>＋</span>'; }, 1300);
  });
});
document.querySelector('.collection-bag')?.addEventListener('click', () => shoppingDialog?.showModal());
document.querySelector('.shopping-close')?.addEventListener('click', () => shoppingDialog?.close());
shoppingDialog?.addEventListener('click', event => { if (event.target === shoppingDialog) shoppingDialog.close(); });
shoppingItemsNode?.addEventListener('click', event => {
  const remove = event.target.closest('[data-remove-item]');
  const quantityButton = event.target.closest('[data-quantity]');
  if (remove) shoppingBag.splice(Number(remove.dataset.removeItem), 1);
  else if (quantityButton) {
    const item = shoppingBag[Number(quantityButton.dataset.index)];
    item.quantity += quantityButton.dataset.quantity === 'plus' ? 1 : -1;
    if (item.quantity < 1) shoppingBag.splice(Number(quantityButton.dataset.index), 1);
  } else return;
  saveShoppingBag();
});
document.querySelector('.proceed-checkout')?.addEventListener('click', () => {
  if (!shoppingBag.length) return;
  shoppingDialog.close();
  document.querySelector('.checkout-dialog')?.showModal();
});
document.querySelector('.checkout-close')?.addEventListener('click', () => document.querySelector('.checkout-dialog')?.close());
document.querySelector('.checkout-form')?.addEventListener('submit', event => {
  event.preventDefault();
  event.currentTarget.reset();
  shoppingBag = [];
  saveShoppingBag();
  document.querySelector('.checkout-dialog')?.close();
  document.querySelector('.shopping-confirmation')?.showModal();
});

const catalog = {
  'sunday-sofa': {name:'The Sunday Sofa', category:'Seating', price:'₹1,48,000', material:'Solid teak · Natural linen', description:'Room to stretch out, settle in, and stay a little longer. Sunday pairs a kiln-dried teak frame with relaxed, removable linen upholstery.', images:['sofa1.webp','sofa2.jpg','sofa3.jpg'], size:'W 220 × D 92 × H 78 cm', lead:'Made to order · 6–8 weeks'},
  'gather-table': {name:'The Gather Table', category:'Tables', price:'₹86,000', material:'Solid oak · Smoked finish', description:'A generous everyday table with softened edges and a calm, sturdy silhouette. Built for long lunches and all the little things in between.', images:['dining1.avif','dining2.jpg','dining3.webp'], size:'W 180 × D 90 × H 76 cm', lead:'Ready in 2–3 weeks'},
  'sunday-chair': {name:'Sunday Lounge Chair', category:'Seating', price:'₹62,500', material:'American walnut · Saddle leather', description:'A low, welcoming seat with a sculpted timber frame and supple leather that grows more beautiful with time.', images:['chair1.jpg','chair2.webp','chair3.jpg'], size:'W 76 × D 82 × H 79 cm', lead:'Made to order · 4–6 weeks'},
  'still-bed': {name:'The Still Bed', category:'Bedroom', price:'₹1,12,000', material:'Solid oak · Natural oil', description:'An unhurried bedroom centrepiece. The Still Bed celebrates the warmth of natural grain and the quiet strength of traditional joinery.', images:['bed2.webp','bed1.jpg','bed3.webp'], size:'Queen · W 160 × L 208 cm', lead:'Made to order · 6–8 weeks'},
  'archive-wardrobe': {name:'Archive Wardrobe', category:'Storage', price:'₹1,64,000', material:'Solid teak · Cane detail', description:'Thoughtful storage with a light touch. Hand-finished teak frames airy woven cane panels and practical, generous shelving.', images:['wardrobe1.jpg','wardrobe3.jpg','wardrobe4.jpg'], size:'W 120 × D 58 × H 200 cm', lead:'Made to order · 8–10 weeks'},
  'sunday-side-table': {name:'Sunday Side Table', category:'Tables', price:'₹28,500', material:'Solid walnut · Hand-rubbed oil', description:'A useful little companion with a soft profile and a satisfying natural finish. Made to sit beside a favourite chair or sofa.', images:['dining2.jpg','dining4.webp','dining5.webp'], size:'W 48 × D 42 × H 52 cm', lead:'Ready in 2–3 weeks'},
  'low-tide': {name:'Low Tide Two Seater', category:'Seating', price:'₹1,18,000', material:'Teak frame · Oatmeal boucle', description:'Clean lines meet cloud-soft upholstery. Low Tide brings an easy, considered presence to smaller living spaces.', images:['sofa2.jpg','sofa4.jpg','sofa5.webp'], size:'W 168 × D 88 × H 76 cm', lead:'Made to order · 6–8 weeks'},
  'cove-bedside': {name:'Cove Bedside', category:'Bedroom', price:'₹24,000', material:'Solid ash · Natural finish', description:'A compact bedside with one generous drawer and a quiet curve. Finished by hand to bring out the beauty of the ash grain.', images:['bed3.webp','bed4.jpg','bed5.webp'], size:'W 48 × D 42 × H 52 cm', lead:'Ready in 2–3 weeks'},
  'form-coffee-table': {name:'Form Coffee Table', category:'Tables', price:'₹42,000', material:'Reclaimed teak · Matte finish', description:'A grounded centrepiece with relaxed proportions and the character of reclaimed teak.', images:['dining4.webp','dining5.webp','dining2.jpg'], size:'W 110 × D 62 × H 38 cm', lead:'Ready in 2–3 weeks'},
  'line-console': {name:'Line Console', category:'Storage', price:'₹54,000', material:'Solid oak · Brushed brass', description:'A slim console that brings considered storage to an entry or living space.', images:['wardrobe3.jpg','wardrobe4.jpg','wardrobe1.jpg'], size:'W 130 × D 38 × H 82 cm', lead:'Made to order · 4–6 weeks'},
  'still-upholstered-bed': {name:'Still Upholstered Bed', category:'Bedroom', price:'₹1,38,000', material:'Solid teak · Cotton slub', description:'The clean silhouette of Still, softened with a tactile, natural cotton headboard.', images:['bed4.jpg','bed5.webp','bed1.jpg'], size:'Queen · W 160 × L 208 cm', lead:'Made to order · 6–8 weeks'},
  'open-shelf': {name:'Open Shelf No. 02', category:'Storage', price:'₹38,000', material:'Solid walnut · Blackened steel', description:'A versatile open shelf with a warm timber frame and finely made steel supports.', images:['wardrobe4.jpg','wardrobe2.avif','wardrobe3.jpg'], size:'W 90 × D 32 × H 180 cm', lead:'Made to order · 4–6 weeks'},
  'cane-lounge-chair': {name:'Cane Lounge Chair', category:'Seating', price:'₹68,000', material:'Solid walnut · Hand-woven cane · Saddle leather', description:'A sculptural everyday seat pairing a solid walnut frame with hand-woven cane and a supple saddle leather cushion.', images:['forma-cane-lounge-chair.png','chair1.jpg','chair3.jpg'], size:'W 74 × D 78 × H 78 cm', lead:'Made to order · 4–6 weeks'},
  'oak-pedestal-table': {name:'Oak Pedestal Table', category:'Tables', price:'₹92,000', material:'Solid oak · Natural oil', description:'A round dining table with a generous, softly edged top and a grounded sculptural pedestal base.', images:['forma-oak-pedestal-table.png','dining1.avif','dining3.webp'], size:'Diameter 120 × H 76 cm', lead:'Made to order · 6–8 weeks'},
  'fluted-sideboard': {name:'Fluted Sideboard', category:'Storage', price:'₹1,18,000', material:'Solid teak · Brushed brass', description:'A refined four-door cabinet with carved fluting, warm teak grain, and understated brushed-brass pulls.', images:['forma-fluted-sideboard.png','wardrobe1.jpg','wardrobe3.jpg'], size:'W 160 × D 45 × H 82 cm', lead:'Made to order · 6–8 weeks'},
  'rust-loveseat': {name:'Rust Linen Loveseat', category:'Seating', price:'₹1,24,000', material:'Solid walnut · Rust linen', description:'A compact two-seat sofa with generous rounded arms, tactile rust linen, and a low solid walnut plinth.', images:['forma-rust-loveseat.png','sofa2.jpg','sofa5.webp'], size:'W 168 × D 86 × H 76 cm', lead:'Made to order · 6–8 weeks'},
  'walnut-coffee-table': {name:'Walnut Coffee Table', category:'Tables', price:'₹48,000', material:'Solid walnut · Natural oil', description:'A low, generous coffee table with rounded corners and sculptural twin pedestal legs, made to anchor the living room.', images:['forma-walnut-coffee-table.png','dining4.webp','dining2.jpg'], size:'W 110 × D 65 × H 38 cm', lead:'Made to order · 4–6 weeks'},
  'boucle-ottoman': {name:'Boucle Ottoman', category:'Seating', price:'₹32,000', material:'Oatmeal boucle · Solid walnut', description:'A soft, tactile extra seat with a neatly tailored boucle cover and tapered walnut feet.', images:['forma-boucle-ottoman.png','chair4.jpg','sofa4.jpg'], size:'W 62 × D 48 × H 42 cm', lead:'Ready in 2–3 weeks'},
  'walnut-bookcase': {name:'Walnut Bookcase', category:'Storage', price:'₹78,000', material:'Solid walnut · Hand finished', description:'An open bookcase with five staggered shelves and a lower cabinet for the things best kept close at hand.', images:['forma-walnut-bookcase.png','wardrobe4.jpg','wardrobe3.jpg'], size:'W 92 × D 34 × H 188 cm', lead:'Made to order · 6–8 weeks'},
  'cane-bedroom-bench': {name:'Cane Bedroom Bench', category:'Bedroom', price:'₹36,000', material:'Natural oak · Woven cane', description:'A low bedroom bench with a handwoven cane seat and a light oak frame, useful at the foot of the bed or in a quiet corner.', images:['forma-cane-bedroom-bench.png','chair2.webp','bed3.webp'], size:'W 110 × D 38 × H 44 cm', lead:'Made to order · 4–6 weeks'}
};

const productPage = document.querySelector('[data-product-page]');
if (productPage) {
  const id = new URLSearchParams(location.search).get('id') || 'sunday-sofa';
  const item = catalog[id] || catalog['sunday-sofa'];
  document.title = `${item.name} — Forma`;
  document.querySelector('.detail-copy h1').textContent = item.name;
  document.querySelector('.detail-price').textContent = item.price;
  document.querySelector('.detail-summary').textContent = item.description;
  const facts = document.querySelectorAll('.detail-facts dd');
  facts[0].textContent = item.material; facts[1].textContent = item.size; facts[2].textContent = item.lead;
  document.querySelectorAll('.detail-gallery img').forEach((img, index) => {
    img.src = `image%20assets/${item.images[index]}`;
    img.alt = `${item.name} — view ${index + 1}`;
  });
  const selectedItem = {id, name:item.name, price:Number(item.price.replace(/[^0-9]/g, '')), image:`image%20assets/${item.images[0]}`};
  document.querySelector('.detail-add-to-bag')?.addEventListener('click', () => {
    addShoppingItem(selectedItem);
    shoppingDialog?.showModal();
  });
  document.querySelector('.detail-buy-now')?.addEventListener('click', () => {
    addShoppingItem(selectedItem);
    const checkoutDialog = document.querySelector('.checkout-dialog');
    if (checkoutDialog?.showModal) checkoutDialog.showModal();
  });
}

document.querySelectorAll('.visit-form').forEach(form => form.addEventListener('submit', event => {
  event.preventDefault();
  const dialog = document.querySelector('.confirmation-dialog');
  if (dialog) { dialog.querySelector('h2').textContent = 'Thanks for reaching out.'; dialog.querySelector('p').textContent = 'Your sample enquiry is noted. We look forward to helping with your space.'; dialog.showModal(); }
  form.reset();
}));
const requestedPiece = new URLSearchParams(location.search).get('piece');
if (requestedPiece) {
  const messageField = document.querySelector('.visit-form textarea[name="message"]');
  if (messageField) messageField.value = `I'm interested in the ${requestedPiece}. `;
}
document.querySelectorAll('.confirmation-close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));

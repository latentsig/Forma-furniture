const filters = document.querySelectorAll('.category-tab');
const products = [...document.querySelectorAll('.product-card')];
filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(item => item.classList.toggle('active', item === button));
  const category = button.dataset.filter;
  products.forEach(card => card.classList.toggle('is-hidden', category !== 'all' && card.dataset.category !== category));
}));

const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
menuButton.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!isOpen));
  nav.classList.toggle('open', !isOpen);
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

const drawer = document.querySelector('.bag-drawer');
const openBag = () => { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; };
const closeBag = () => { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
const bagTrigger = document.querySelector('.cart-trigger');
if (bagTrigger?.tagName === 'BUTTON') bagTrigger.addEventListener('click', openBag);
document.querySelector('.close-drawer').addEventListener('click', closeBag);
document.querySelector('.drawer-backdrop').addEventListener('click', closeBag);
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeBag(); });

const bag = [];
const rupees = value => `₹${value.toLocaleString('en-IN')}`;
const toast = document.querySelector('.toast');
let toastTimeout;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2600);
}
function renderBag() {
  const container = document.querySelector('.bag-items');
  const count = bag.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.bag-count').forEach(node => node.textContent = count);
  document.querySelector('.bag-subtotal').textContent = rupees(bag.reduce((sum, item) => sum + item.price * item.quantity, 0));
  if (!bag.length) {
    container.innerHTML = '<p class="empty-bag">Your bag is taking a quiet moment.<br>Find something lovely to bring home.</p>';
    return;
  }
  container.innerHTML = bag.map((item, index) => `<div class="bag-item"><img src="${item.image}" alt=""><div><h3>${item.name}</h3><p>${rupees(item.price)}</p><div class="quantity"><button data-action="minus" data-index="${index}" aria-label="Remove one ${item.name}">−</button><span>${item.quantity}</span><button data-action="plus" data-index="${index}" aria-label="Add one ${item.name}">+</button></div></div><div class="bag-item-price">${rupees(item.price * item.quantity)}<button class="remove-item" data-action="remove" data-index="${index}">Remove</button></div></div>`).join('');
}
document.querySelectorAll('.product-card').forEach(card => {
  const link = card.querySelector('.product-image');
  const title = card.querySelector('h3').textContent;
  const price = Number(card.querySelector('.product-info>span').textContent.replace(/[^0-9]/g, ''));
  const image = card.querySelector('img').getAttribute('src');
  const productIds = {'The Sunday Sofa':'sunday-sofa','The Gather Table':'gather-table','Sunday Lounge Chair':'sunday-chair','The Still Bed':'still-bed','Archive Wardrobe':'archive-wardrobe','Sunday Side Table':'sunday-side-table','Low Tide Two Seater':'low-tide','Cove Bedside':'cove-bedside','Form Coffee Table':'form-coffee-table','Line Console':'line-console','Still Upholstered Bed':'still-upholstered-bed','Open Shelf No. 02':'open-shelf'};
  const productId = productIds[title];
  link.href = `product.html?id=${productId || 'sunday-sofa'}`;
  const details = document.createElement('a');
  details.className = 'product-detail-link';
  details.href = link.href;
  details.textContent = 'Details ↗';
  card.querySelector('.product-info').append(details);
  const quickLabel = link.querySelector('.quick-view');
  const quickAdd = document.createElement('button');
  quickAdd.className = 'quick-view quick-add';
  quickAdd.type = 'button';
  quickAdd.textContent = 'Quick add to bag +';
  if (quickLabel) quickLabel.remove();
  link.after(quickAdd);
  quickAdd.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    const found = bag.find(item => item.name === title);
    if (found) found.quantity += 1;
    else bag.push({name:title, price, image, quantity:1});
    renderBag();
    showToast(`${title} added to your bag`);
  });
});
document.querySelector('.bag-items').addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const item = bag[Number(button.dataset.index)];
  if (button.dataset.action === 'plus') item.quantity++;
  if (button.dataset.action === 'minus') item.quantity--;
  if (button.dataset.action === 'remove' || item.quantity <= 0) bag.splice(Number(button.dataset.index), 1);
  renderBag();
});
const checkoutDialog = document.querySelector('.checkout-dialog');
document.querySelector('.checkout-button').addEventListener('click', () => {
  if (!bag.length) { showToast('Your bag is empty'); return; }
  checkoutDialog.showModal();
});
document.querySelector('.dialog-close').addEventListener('click', () => checkoutDialog.close());
checkoutDialog.addEventListener('click', event => { if (event.target === checkoutDialog) checkoutDialog.close(); });
document.querySelector('.checkout-form').addEventListener('submit', event => {
  event.preventDefault();
  event.currentTarget.reset();
  checkoutDialog.close();
  closeBag();
  bag.length = 0;
  renderBag();
  document.querySelector('.confirmation-dialog').showModal();
});
document.querySelector('.confirmation-close').addEventListener('click', () => document.querySelector('.confirmation-dialog').close());

document.querySelector('.enquiry-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const body = [`Name: ${data.get('name')}`, `Email: ${data.get('email')}`, `Interested in: ${data.get('interest')}`, '', `Project details: ${data.get('message') || 'Not provided'}`].join('\n');
  window.location.href = `mailto:hello@forma.studio?subject=${encodeURIComponent(`Forma enquiry: ${data.get('interest')}`)}&body=${encodeURIComponent(body)}`;
  document.querySelector('.form-message').textContent = 'Your email app is opening with your enquiry ready to send.';
  event.currentTarget.reset();
});

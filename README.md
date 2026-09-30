# Forma Furniture Website

A responsive, multi-page furniture website built with plain HTML, CSS, and JavaScript. Product and interior photography is in `image assets/`.

## Technology and typography

This is a lightweight static site: semantic HTML for each page, CSS Grid/Flexbox and media queries for responsive layouts, and vanilla JavaScript for filters, product details, navigation, and demo interactions. It has no framework, build step, or package dependencies. The visual identity pairs expressive **Cormorant Garamond** headings with compact **Manrope** display details and readable **DM Sans** interface text. Google Fonts load over the network; system serif and sans-serif fallbacks are included.

## Run locally

Python 3 is required. From this project folder, start a local static web server:

```powershell
python -m http.server 8002 --bind 127.0.0.1
```

Then open <http://127.0.0.1:8002/> in a browser. Keep the terminal running while you use the site. If port 8002 is already in use, choose another port in the command and URL.

The site is also currently running at <http://127.0.0.1:8002/>.

## Project files

- `index.html` — editorial homepage and shopping request demo
- `collections.html` — filterable furniture catalogue
- `product.html` — product details selected by a product ID in the URL
- `spaces.html` — selected interior stories
- `craft.html` — materials and making story
- `journal.html` — editorial article
- `visit.html` — showroom details and project enquiry form
- `styles.css`, `pages.css`, and `cart.css` — responsive layouts, visual styling, and the collection bag panel
- `script.js` and `pages.js` — catalogue filters, product details, mobile navigation, shopping bag, and demo confirmations
- `image assets/` — supplied furniture photography plus original Forma editorial and product images. Generated product photos include the cane lounge chair, oak pedestal table, fluted sideboard, rust loveseat, walnut coffee table, boucle ottoman, walnut bookcase, and cane bedroom bench.

## Interactions

- Filter the collection by seating, tables, bedroom, or storage.
- Select a product photo or **Explore** link on Collections to open its detail page.
- On Collections, use **Add to Cart** or **Explore** for product details. The bag supports quantity changes and a demo checkout that ends with an order confirmation; no payment is taken and no order is sent.
- Product pages show the material, dimensions, finish, availability, and an enquiry action.
- Continue to checkout, enter sample delivery details, and see an on-page confirmation. No email is sent and no payment is processed.
- Submit an enquiry to open an email draft with the project details.
- Open the journal story from either journal link.

Checkout is a front-end demo: it shows an order confirmation and clears the bag without taking payment or sending/storing an order. The demo bag is stored in browser local storage. Enquiries open a prefilled draft in the visitor’s email app. This static site does not process payments or persist submissions.

const searchContainer = document.getElementById('searchContainer');
const galleryContainer = document.getElementById('galleryContainer');
const navigationContainer = document.getElementById('navigationContainer');

const apiKey = 'd32660754fde2d5cc4d58253df6d3cee';

let state = {
  searchPage: 0,
  searchResults: {},
  page: 'search',
  galleryImages: {},
}

function initialize() {
  const previousState = JSON.parse(localStorage.getItem('state'));

  if (previousState) {
    state = previousState
  }

  render();
}

function persist() {
  localStorage.setItem('state', JSON.stringify(state));
}

initialize()

async function search(page = 1) {
  const searchQuery = document.getElementById('searchBar').value;
  const result = await fetch(`https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=${apiKey}&text=${searchQuery}&format=json&nojsoncallback=1&page=${page}`);
  const data = await result.json();

  // if loading first page, unset previous data
  if (page === 1) {
    state.searchResults = {}
  }

  const returnedResults = {};

  data.photos.photo.forEach(photo => {
    returnedResults[photo.id] = photo
  });

  // merge previous result with returned results
  state.searchResults = {...state.searchResults, ...returnedResults};

  // update page
  state.searchPage = page;

  render();
  persist();
}

function addToGallery(id) {
  state.galleryImages[id] = state.searchResults[id];

  render();
  persist();
}

function removeFromGallery(id) {
  delete state.galleryImages[id];

  render();
  persist();
}

function showPage(page) {
  state.page = page

  render();
  persist();
}

function render() {
  const { page, searchResults, galleryImages, searchPage } = state

  // if we're on search page, show search input
  if (page === 'search') {
    searchContainer.innerHTML = `
        <input type="text" name="searchBar" id="searchBar" placeholder="search for an image" />
        <button type="submit" class="btn" onClick="search()">search</button>
    `
  } else {
    searchContainer.innerHTML = '';
  }

  // toggle page
  const otherPage = page === 'gallery' ? 'search' : 'gallery'

  navigationContainer.innerHTML = `
    <button type="button" class="btn" onClick="showPage('${otherPage}')">Show ${otherPage}</button>
  `

  // conditionally select collection based on page (search results or gallery collection)
  const images = page === 'search' ? Object.values(searchResults) : Object.values(galleryImages)

  const html = `<div>
    ${images.map(result => {
        const isInGallery = !!galleryImages[result.id]

        return `<div>
            <img src="https://live.staticflickr.com/${result.server}/${result.id}_${result.secret}.jpg" />
            <button type="button" class="btn" onClick="${isInGallery ? 'removeFromGallery' : 'addToGallery'}(${result.id})">${isInGallery ? '-' : '+'}</button>
        </div>`
    })}

    ${page === 'search' && searchPage > 0 ? `<button type="button" class="btn" onClick="search(${searchPage + 1})">load more</button>` : ''}
  </div>`

  galleryContainer.innerHTML = html;
}


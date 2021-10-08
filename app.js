const searchContainer = document.getElementById('searchContainer');
const galleryContainer = document.getElementById('galleryContainer');
const navigationContainer = document.getElementById('navigationContainer');
const footerContainer = document.getElementById('footerContainer');

const apiKey = 'b54580f369a7eeebecb2004dc429d08f';

let state = {
  searchPage: 0,
  searchResults: {},
  page: 'Search',
  galleryImages: {},
  searchQuery: '',
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
  const result = await fetch(`https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key=${apiKey}&text=${state.searchQuery}&format=json&nojsoncallback=1&page=${page}`);
  const data = await result.json();

  // if loading first page, unset previous data
  if (page === 1) {
    state.searchResults = {}
  }

  const returnedResults = {};

  if (data.photos && data.photos.photo) {
    data.photos.photo.forEach(photo => {
      returnedResults[photo.id] = photo
    });

    // merge previous result with returned results
    state.searchResults = {...state.searchResults, ...returnedResults};

    // update page
    state.searchPage = page;
  } else if (data.stat === 'fail') {
    alert(data.message);
  }

  render();
  persist();
}

function onSearchChanged(e) {
  if (e.keyCode === 13) {
    search();
  }

  state.searchQuery = document.getElementById('searchBar').value;
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

  footerContainer.innerHTML = ''

  // if we're on search page, show search input
  if (page === 'Search') {
    searchContainer.innerHTML = `
        <input type="text" name="searchBar" id="searchBar" class="searchBar" placeholder="search for an image" onkeyup="return onSearchChanged(event)" value="${state.searchQuery}" />
        <button type="submit" class="btn btn__search" onClick="search()">search</button>
    `

    if (searchPage > 0) {
      footerContainer.innerHTML = `<button type="button" class="btn btn--more" onClick="search(${searchPage + 1})">More</button>`
    }
  } else {
    searchContainer.innerHTML = '';
  }

  // toggle page
  const otherPage = page === 'Gallery' ? 'Search' : 'Gallery'

  navigationContainer.innerHTML = `
    <button type="button" class="btn" onClick="showPage('${otherPage}')">Show ${otherPage}</button>
  `

  // conditionally select collection based on page (search results or gallery collection)
  const images = page === 'Search' ? Object.values(searchResults) : Object.values(galleryImages)

  const html = `<div class="gallery">
    ${images.map(result => {
        const isInGallery = !!galleryImages[result.id]

        return `<div class="imageContainer">
            <img src="https://live.staticflickr.com/${result.server}/${result.id}_${result.secret}.jpg" class="gallery__img"/>
            <button type="button" class="btn btn--fav" onClick="${isInGallery ? 'removeFromGallery' : 'addToGallery'}(${result.id})">${isInGallery ? '-' : '+'}</button>
        </div>`
    }).join('')}
  </div>`

  galleryContainer.innerHTML = html;
}

var script = document.createElement('script');
script.src = chrome.extension.getURL('wykop.pl.injected.js');
script.onload = function() {
    this.parentNode.removeChild(this);
};
(document.head||document.documentElement).appendChild(script);

const HIDE_TXT = '[ Hide ]';
const SHOW_TXT = '[ Show ]';
const SHOW_HIDE_BTN_CLASS = 'bddt_showHideBtn';
const HIDDEN_ITEM_CLASS = 'bddt_hiddenItem';
const HIDDEN_ITEM_IDS_KEY = 'bddt_hiddenItemIds';

var storageReady = true;

function createShowHideBtn(item, className)
{
	var e = document.createElement('div');
	
	e.className = SHOW_HIDE_BTN_CLASS + ' ' + className;
	e.innerText = HIDE_TXT;
	
	e.addEventListener('click', function() { showHideBtn_click(item); });
	
	return e;
}

function setShowHideBtnsText(item, text)
{
	var btns = item.querySelectorAll('.'+SHOW_HIDE_BTN_CLASS);
	
	for(var i=0; i<btns.length; i++)
	{
		btns[i].innerText = text;
	}
}

function when(condition, action)
{
	if(condition)
	{
		action();
		return;
	}
	
	setTimeout(10, when(condition, action));
}

function isStorageReady() { return storageReady; }

function getHiddenItemIds(callback)
{
	chrome.storage.sync.get(function(value) {
		value = value || {};
		value = value[HIDDEN_ITEM_IDS_KEY] || {};
		callback(value);
	});
}

function saveHiddenItemIds(hiddenItemIds, callback)
{
	storage = {};
	storage[HIDDEN_ITEM_IDS_KEY] = hiddenItemIds;
	chrome.storage.sync.set(storage, callback);
}

function remember(itemId, isVisible)
{
	when(isStorageReady, function() {
		storageRead = false;
		getHiddenItemIds(function(hiddenItemIds) {			
			if(isVisible)
			{
				delete hiddenItemIds[itemId];
			}
			else
			{
				hiddenItemIds[itemId] = true;
			}
			
			saveHiddenItemIds(hiddenItemIds, function() { storageReady = true; })
		});
	});
}

function getItemId(item)
{
	return item.querySelector('.wblock').getAttribute('data-id');
}

function hide(item, shouldRefresh)
{
	item.classList.add(HIDDEN_ITEM_CLASS);
	setShowHideBtnsText(item, SHOW_TXT);
	
	if(shouldRefresh)
	{
		refreshImages();
	}
}

function show(item)
{
	item.classList.remove(HIDDEN_ITEM_CLASS);
	setShowHideBtnsText(item, HIDE_TXT);
}

function refreshImages()
{
	setTimeout(function() {
		document.dispatchEvent(new CustomEvent('bddt_lazyload'));
	}, 0);
}

function showHideBtn_click(item)
{
	var itemId = getItemId(item);
	
	if(item.classList.contains(HIDDEN_ITEM_CLASS))
	{
		show(item);
		remember(itemId, true);
	}
	else
	{
		hide(item, true);
		remember(itemId, false);
		when(function() { return item.clientHeight < 70; }, function() { location.hash = '#' + item.querySelector('a').name; });
	}
}

function injectShowHideButtons()
{
	var items = document.querySelectorAll('ul#itemsStream > li');
	var itemsById = {};
	
	for(var i=0; i<items.length; i++)
	{
		var item = items[i];
		var itemId = getItemId(item);
		var author = item.querySelectorAll('.author')[0];
		
		var showHideBtn_bottom = createShowHideBtn(item, 'bddt_showHideBtn_bottom');
		var showHideBtn_author = createShowHideBtn(item, 'bddt_showHideBtn_author');
		
		item.appendChild(showHideBtn_bottom);
		author.appendChild(showHideBtn_author);
		
		itemsById[itemId] = item;
	}
	
	getHiddenItemIds(function(hiddenItemIds) {
		ids = Object.keys(hiddenItemIds);
		
		for(var i=0; i<ids.length; i++)
		{
			id = ids[i];
			item = itemsById[id];
			
			if(item)
			{
				hide(itemsById[id]);
			}
		}
		
		refreshImages();
	});
}

injectShowHideButtons();
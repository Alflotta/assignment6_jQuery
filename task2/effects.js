var popup = null, closing = false, pending = null;

function findRoom(id) {
  return party.filter(function (r) { return r.id === id; })[0];
}

function findGuest(name) {
  var res = null;
  party.forEach(function (r) {
    r.guests.forEach(function (g) { if (g.name === name) res = { room: r, guest: g }; });
  });
  return res;
}

$(document).on('built', function () {
  if (popup) popup.stop(true).remove();
  popup = null; closing = false; pending = null;
  $('.fly').remove();
  $('.room h3').append('<button class="sort">Sort by time</button>');
});

$(document).on('caseDone', function (e, $found) {
  var $keep = $found.is('.room') ? $found.find('.guest') : $found;
  $('.guest').not($keep).fadeTo(300, 0.2);
});

$('#clear').on('click', function () {
  $('.found').removeClass('found');
  $('.guest').not(function () { return $(this).data('moving'); }).stop(true, true).fadeTo(300, 1);
  $('#result').text('Pick a case.');
});

var COLORS = ['red', 'blue', 'green', 'black', 'yellow', 'purple'];
var THINGS = { phone: 'a phone', glasses: 'glasses', bag: 'a bag', cup: 'a cup', crumbs: 'cake crumbs' };

// read the guest data back from the card (classes + data-* attributes)
function guestFromCard($g) {
  return {
    name: $g.data('name'),
    time: $g.data('time'),
    aitu: $g.hasClass('aitu'),
    color: COLORS.filter(function (c) { return $g.hasClass(c); })[0],
    things: Object.keys(THINGS).filter(function (t) { return $g.hasClass(t); })
  };
}

function thingsText(things) {
  if (!things.length) return 'Came with nothing';
  var words = things.map(function (t) { return THINGS[t]; });
  var last = words.pop();
  return 'Has ' + (words.length ? words.join(', ') + ' and ' : '') + last;
}

function showCard($g) {
  var g = guestFromCard($g), name = g.name;
  var $room = $g.closest('.room'), inArray = !!findGuest(name);
  var html = '<h4>' + name + '</h4><ul>' +
    '<li>Came at ' + g.time + '</li>' +
    '<li>' + (g.aitu ? 'AITU student' : 'Not an AITU student') + '</li>' +
    '<li>Wearing ' + g.color + '</li>' +
    '<li>' + thingsText(g.things) + '</li>' +
    '<li>Now in the ' + $room.data('name').toLowerCase() + '</li></ul>';
  if (inArray) {
    party.forEach(function (r) {
      if (r.id !== $room.attr('id')) html += '<button class="move" data-room="' + r.id + '">Move to the ' + r.name.toLowerCase() + '</button>';
    });
  }

  var $ring = $g.find('.ring'), o = $ring.offset(), w = $ring.outerWidth();
  popup = $('<div id="popup">').html(html).data('guest', name)
    .css({ left: -9999, top: 0, width: 250, height: 'auto' }).appendTo('body');
  var fullH = popup.outerHeight();
  var left = Math.max(8, Math.min(o.left + w / 2 - 125, $(document).width() - 258));
  var small = { left: o.left, top: o.top, width: w, height: w, opacity: 0.3 };
  popup.data('small', small).css(small)
    .animate({ left: left, top: o.top, width: 250, height: fullH, opacity: 1 }, 300);
}

function closeCard() {
  if (!popup || closing) return;
  closing = true;
  popup.stop(true).animate(popup.data('small'), 250, function () {
    popup.remove(); popup = null; closing = false;
    if (pending) { var p = pending; pending = null; showCard(p); }
  });
}

$('#house').on('click', '.guest', function () {
  var $g = $(this);
  if ($g.data('moving')) return;
  if (popup && !closing && popup.data('guest') === $g.data('name')) { closeCard(); return; }
  pending = $g;
  if (popup) closeCard();
  else if (!closing) { pending = null; showCard($g); }
});

$(document).on('keydown', function (e) {
  if (e.key === 'Escape') { pending = null; closeCard(); }
});

$(document).on('click', function (e) {
  if (!$(e.target).closest('#popup, .guest').length) { pending = null; closeCard(); }
});

$(document).on('click', '#popup .move', function () {
  var name = popup.data('guest');
  pending = null; closeCard();
  moveGuest(name, $(this).data('room'));
});

function moveGuest(name, toId) {
  var info = findGuest(name), $g = $('.guest[data-name="' + name + '"]').not('.fly');
  if (!info || !$g.length || info.room.id === toId || $g.data('moving')) return;

  var to = findRoom(toId);
  info.room.guests.splice(info.room.guests.indexOf(info.guest), 1);
  to.guests.push(info.guest);
  $('#' + info.room.id + ', #' + toId).data('sorted', false).find('.sort').text('Sort by time');

  var w = $g.outerWidth(), start = $g.offset(), startOpacity = $g.css('opacity');
  var $fly = $g.clone().addClass('fly')
    .css({ left: start.left, top: start.top, width: w }).appendTo('body');

  var $gap = $('<div class="gap">').css('width', w).insertAfter($g);
  $g.remove();
  $gap.animate({ width: 0 }, 600, function () { $(this).remove(); });

  var $new = makeCard(info.guest).css({ width: w, opacity: 0 }).data('moving', true)
    .appendTo('#' + toId + ' .guests');
  var target = $new.offset();          // measured at full width, so the flight lands in the right row
  $new.css('width', 0).animate({ width: w }, 600);

  $fly.animate({ left: target.left, top: target.top }, 700, function () {
    $fly.remove();
    $new.css('opacity', startOpacity).data('moving', false);
  });
}

$(document).on('click', '.sort', function () {
  var $room = $(this).closest('.room'), room = findRoom($room.attr('id'));
  var sorted = !$room.data('sorted');
  $room.data('sorted', sorted);
  $(this).text(sorted ? 'Back to picture order' : 'Sort by time');

  var $box = $room.find('.guests'), $cards = $box.children('.guest');
  var $still = $cards.not(function () { return $(this).data('moving'); });

  var oldPos = {};
  $cards.each(function () { oldPos[$(this).data('name')] = $(this).offset(); });
  $still.stop(true, true);

  var names = room.guests.map(function (g) { return g.name; });
  var order = $cards.get().sort(function (a, b) {
    return sorted ? $(a).data('min') - $(b).data('min')
                  : names.indexOf($(a).data('name')) - names.indexOf($(b).data('name'));
  });
  $box.append(order);

  $still.each(function () {
    var $c = $(this), was = oldPos[$c.data('name')], now = $c.offset();
    $c.css({ left: was.left - now.left, top: was.top - now.top }).animate({ left: 0, top: 0 }, 600);
  });
});

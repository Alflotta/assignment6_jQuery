var AVATAR = 'https://api.dicebear.com/9.x/lorelei/svg?glassesProbability=0';
var LOOK = {
  f: '&earringsProbability=100&hairAccessoriesProbability=60&beardProbability=0',
  m: '&earringsProbability=0&hairAccessoriesProbability=0&beardProbability=40'
};

function avatar(g) {
  return AVATAR + LOOK[g.sex] + '&seed=' + g.name;
}

var ICONS = { phone: '📱', glasses: '👓', bag: '👜', cup: '☕', crumbs: '🍰' };

function toMin(t) {
  var p = t.split(':');
  return p[0] * 60 + +p[1];
}

function makeCard(g) {
  var icons = g.things.map(function (t) { return ICONS[t]; }).join(' ');
  return $('<div class="guest">')
    .addClass(g.color + ' ' + g.things.join(' '))
    .toggleClass('aitu', g.aitu)
    .attr({ 'data-name': g.name, 'data-time': g.time, 'data-min': toMin(g.time) })
    .html(
      '<div class="ring"><img alt="" src="' + avatar(g) + '"></div>' +
      (g.aitu ? '<span class="badge">🎓</span>' : '') +
      '<b>' + g.name + '</b><small>⏱ ' + g.time + '</small><div class="icons">' + icons + '</div>'
    );
}

function build() {
  var $house = $('#house').empty();
  [2, 1].forEach(function (n) {
    var $floor = $('<div class="floor">').attr('id', 'floor' + n)
      .append('<div class="floor-label">Floor ' + n + '</div>').appendTo($house);
    party.filter(function (r) { return r.floor === n; }).forEach(function (r) {
      var $room = $('<div class="room">').attr({ id: r.id, 'data-name': r.name })
        .append('<h3><span>' + r.name + '</span></h3><div class="guests"></div>').appendTo($floor);
      r.guests.forEach(function (g) { $room.find('.guests').append(makeCard(g)); });
    });
  });
  $(document).trigger('built');
}

var cases = [
  ['Who is in the hall?', function () {
    return $('#hall .guest');
  }],
  ['Who is dressed in yellow or purple?', function () {
    return $('.guest.yellow, .guest.purple');
  }],
  ['Which AITU students are upstairs?', function () {
    return $('#floor2 .guest.aitu');
  }],
  ['Who has glasses or a bag?', function () {
    return $('.guest.glasses, .guest.bag');
  }],
  ['Who came with nothing at all?', function () {
    return $('.guest').not('.phone, .glasses, .bag, .cup, .crumbs');
  }],
  ['Who has a phone but no bag?', function () {
    return $('.guest.phone').not('.bag');
  }],
  ['Who arrived between 20:30 and 21:00?', function () {
    return $('.guest').filter(function () {
      return $(this).data('min') >= 1230 && $(this).data('min') <= 1260;
    });
  }],
  ['Who arrived after 21:00 and is not AITU?', function () {
    return $('.guest').not('.aitu').filter(function () { return $(this).data('min') > 1260; });
  }],
  ['Who stands right next to Askar?', function () {
    return $('.guest[data-name="Askar"]').prev().add('.guest[data-name="Askar"] + .guest');
  }],
  ['Who stands last in each room?', function () {
    return $('.guest:last-child');
  }],
  ['Who stands third in each room?', function () {
    return $('.guest:nth-child(3)');
  }],
  ['Who stands after Timur in his room?', function () {
    return $('.guest[data-name="Timur"]').nextAll();
  }],
  ['Who stands right before someone in black?', function () {
    return $('.guest.black').prev();
  }],
  ['In which room is Aruzhan?', function () {
    return $('.guest[data-name="Aruzhan"]').closest('.room');
  }],
  ['Which rooms have fewer than 6 guests?', function () {
    return $('.room').filter(function () { return $(this).find('.guest').length < 6; });
  }],
  ['Rooms with a cup but nobody in glasses?', function () {
    return $('.room:has(.guest.cup)').not(':has(.guest.glasses)');
  }],
  ['Who came first to each room?', function () {
    return $('.room').map(function () {
      return $(this).find('.guest').toArray().sort(function (a, b) {
        return $(a).data('min') - $(b).data('min');
      })[0];
    });
  }],
  ['Miras (blue, AITU, 21:20, phone) joins between Askar and Inkar', function () {
    return makeCard({ name: 'Miras', sex: 'm', color: 'blue', time: '21:20', aitu: true, things: ['phone'] })
      .hide().insertAfter('.guest[data-name="Askar"]').fadeIn(800);
  }],
  ['Natasha goes home', function () {
    return $('.guest[data-name="Natasha"]').fadeOut(800, function () { $(this).remove(); });
  }],
  ['Who took the cake?', function () {
    return $('#floor1 .guest.crumbs').not('.cup')
      .filter(function () { return $(this).data('min') > 1260 && $(this).data('min') < 1290; })
      .filter(function () { return $(this).prev().add($(this).next()).filter('.aitu').length > 0; });
  }]
];

function runCase(i) {
  build();
  var $found = cases[i][1]();
  $(document).trigger('caseDone', [$found]);
  $found.addClass('found').animate({ top: -14 }, 150).animate({ top: 0 }, 150);
  var names = $found.map(function () { return $(this).data('name'); }).get();
  $('#result').html('<b>Case ' + (i + 1) + ':</b> ' + cases[i][0] +
    '<br>Found <b>' + names.length + '</b>: ' + (names.join(', ') || 'nobody'));
}

$(function () {
  cases.forEach(function (c, i) {
    $('<button class="case">').text(i + 1).attr('title', c[0]).appendTo('#cases');
  });
  $('#cases').on('click', '.case', function () { runCase($(this).index()); });
  build();
});

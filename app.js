var all_items = null;
var chart     = null;

// http://stackoverflow.com/questions/1484506/random-color-generator-in-javascript
function random_color(){
  return '#'+Math.floor(Math.random()*16777215).toString(16);
}

function draw_graph(type, data){
  // prepare data
  counts = {};
  data.map(function(o){
    return o.language;
  }).forEach(function(k){
    counts[k] = (counts[k]||0)+1;
  });
  // var keys   = Object.keys(counts);   --- not work on android chrome
  // var values = Object.values(counts); --- not work on android chrome
  var keys   = [];
  var values = [];
  $.each(counts, function(k, v){
    keys.push(k);
    values.push(v);
  })

  // random graph color
  colors = [];
  keys.forEach(function(){
    colors.push(random_color());
  });
  if(['line', 'radar'].indexOf(type) != -1){
    colors = colors[0];
  }

  // draw graph
  if(window.chart){
    chart.config.type = type;
    chart.data.labels = keys;
    chart.data.datasets[0].data = values;
    chart.data.datasets[0].backgroundColor = colors;
    chart.update();
  }
  else {
    var config = {
        type: type,
        data: {
            labels: keys,
            datasets: [{
                label: '# of Languages',
                data: values,
                backgroundColor: colors,
            }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
        },
    };

    // line and bar graph start from zero
    if(['line', 'bar'].indexOf(type) != -1){
      config.options.scales = { yAxes: [{ ticks: { beginAtZero: true } }] };
    }

    // generate new chart
    var ctx = document.getElementById("myChart");
    window.chart = new Chart(ctx, config);
  }
}

// after fetch process
function do_when_fetch_done(username, git_type, graph_type, data){
  sessionStorage.setItem(git_type+'_'+username, JSON.stringify(data));
  draw_graph(graph_type, data);
  $('#search').removeClass('is-loading');
}

// fetch data from github api or use cache
function fetch_data(username, git_type, graph_type, page_no){
  var cache_items = sessionStorage.getItem(git_type+'_'+username) || null;
  var graph_type  = graph_type || 'line';
  if(cache_items){
    cache_items = JSON.parse(cache_items);
    console.log('<'+ username +'|'+ git_type +'> use cache data {'+ cache_items.length +'}');
    do_when_fetch_done(username, git_type, graph_type, cache_items);
  }
  else {
    var page_no = page_no || 1;
    $.ajax({
      url: 'https://api.github.com/users/'+ username +'/'+ git_type +'?page='+ page_no,
      success: function(items){
        if(items.length > 0){
          console.log('<'+ username +'|'+ git_type +'> fetching page '+ page_no +'.. {'+ items.length +'}');
          all_items = all_items.concat(items);
          fetch_data(username, git_type, graph_type, page_no+1);
        }
        else {
          console.log('<'+ username +'|'+ git_type +'> fetch done');
          do_when_fetch_done(username, git_type, graph_type, all_items);
        }
      },
      error: function(a, b, c){
        alert(a.responseJSON.message);
        console.log(a, b, c);
        $('#search').removeClass('is-loading');
      }
    });
  }
}

// bind search event
$('#search').click(function(){
  all_items = [];
  $('#search').addClass('is-loading');
  fetch_data($('#username').val(),
             $('#git_type').val(),
             $('#graph_type').val());
});
$('#username').keypress(function(e) {
  if(e.which == 13) {
    $('#search').click();
  }
});

// bind git type
$('#git_type').change(function(){
  $('#search').click();
});

// bind graph type
$('#graph_type').change(function(){
  window.chart.destroy();
  window.chart = null;
  $('#search').click();
});

// when start, draw diewland graph
$('#search').click();

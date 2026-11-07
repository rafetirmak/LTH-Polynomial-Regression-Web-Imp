/***************************************************************************
 *   Copyright (C) 2012, Paul Lutus                                        *
 *                                                                         *
 *   This program is free software; you can redistribute it and/or modify  *
 *   it under the terms of the GNU General Public License as published by  *
 *   the Free Software Foundation; either version 2 of the License, or     *
 *   (at your option) any later version.                                   *
 *                                                                         *
 *   This program is distributed in the hope that it will be useful,       *
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of        *
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         *
 *   GNU General Public License for more details.                          *
 *                                                                         *
 *   You should have received a copy of the GNU General Public License     *
 *   along with this program; if not, write to the                         *
 *   Free Software Foundation, Inc.,                                       *
 *   59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.             *
 ***************************************************************************/

function addEvent(o,e,f) {
  if (o.addEventListener) {
    o.addEventListener(e,f,false);
    return true;
  }
  else if (o.attachEvent) {
    return o.attachEvent("on"+e,f);
  }
  else {
    return false;
  }
}

function graph_dim_class(xl,xh,yl,yh) {
  this.xl = xl;
  this.xh = xh;
  this.yl = yl;
  this.yh = yh;
  this.str = function() {
    return this.xl + "," + this.xh + "," + this.yl + "," + this.yh;
  }
}

function axis_data_class(min,max,steps,label,nums) {
  var exp_ratio = 0.1;
  this.min = min;
  this.max = max;
  this.minlimit = min * 8;
  this.maxlimit = max * 8;
  var exp = (max-min) * exp_ratio
  this.gmin = min - exp;
  this.gmax = max + exp;
  this.steps = steps;
  this.increm = (max-min)/steps;
  this.label = label;
  this.nums = nums;
  this.str = function() {
    return this.min + "," + this.max + "," + this.steps + "," + this.increm + "," + this.label + "," + this.nums;
  }
}

// polynomial processing namespace

var poly = poly || {}

poly.output_form = 1;

poly.default_font_size = "80%";

poly.left_margin = 8;
poly.right_margin = 8;
poly.top_margin = 8;
poly.bottom_margin = 32;
poly.x_axis_data = null;
poly.y_axis_data = null;
poly.grid_color = "rgb(192,240,192)";
poly.plot_color = "rgb(64,0,255)";
poly.point_color = "rgb(255,0,0)";
poly.explore_color = "rgb(128,0,128)";
poly.mousedown = false;

poly.poly_terms = null;
poly.xy_data = null;

poly.poly_degree = 2;

poly.plot_steps = 500;

poly.reverse_xy = false;

poly.i18n = {
  tr: {
    page_title: "Kan Laktat Eşiği Hesaplayıcısı",
    main_heading: "Kan Laktat Eşiğinin Polinominal Modelleri",
    copyright_1: "Copyright © 2013, P. Lutus — PolySolve (07.20.2013) JavaScript Sürümünden Uyarlanmıştır.",
    copyright_2: "Copyright © 2014, Uyarlama Rafet IRMAK",
    subtopic: "Kan Laktat Eşiği Hesaplayıcısı",
    lang_btn: "🇬🇧 EN",
    data_entry_label: "İş Yükü Kan Laktat Eşiği Veri Girişi:",
    shortcuts: "Seç: Ctrl+A | Kopyala: Ctrl+C | Yapıştır: Ctrl+V",
    curve_title: "İş Yükü Kan Laktat Eşiği Eğrisi:",
    curve_hint: "Hesaplanmış laktat ve iş yükü değerlerini görmek için, fareyi sol tuşa basarak grafik üstünde gezdirin.",
    reverse_label: "Eksenleri Değiştir (x,y -> y,x)",
    degree_label: "Polinominal Regresyon Derecesi:",
    btn_best_fit: "En Uyumlu Model",
    btn_solve: "Çöz",
    btn_output: "Çıktı Formu",
    btn_graph: "Grafik",
    result_heading: "Sonuç:",
    result_explanation: "<br> Regresyon Modeli fizyolojik nedenselliğe uygun olarak iş yükü (x) – laktat (y) ilişkisini (y = f(x)) modeller ve sabit laktat eşiklerine (2.0, 2.5 ve 4.0 mmol/L) karşılık gelen iş yüklerini denklemi tersine çözerek (ters kestirim) hesaplar.<br>",
    table_heading: "Tablo:",
    tbl_start: "Başlangıç:",
    tbl_end: "Bitiş:",
    tbl_step: "Adım:",
    tbl_decimals: "Ondalık:",
    tbl_exp: "Üstel (Exponential)",
    btn_create_table: "Tablo Oluştur",
    form_labels: ['basit liste', 'matematik fonksiyon', 'C/C++ fonksiyonu', 'Java Fonksiyonu'],
    wheel_title: "Değerleri Fare Tekerleğini Kullanarak Değiştirin.",
    chart_title: function(n, deg) { return n + " adet veri noktası ile oluşturulmuş " + deg + ". dereceden Polinominal"; },
    err_range: "Hata: Sayı Aralığı",
    err_mismatch: "Uyuşmayan Veri (x sayısı != y sayısı).",
    err_no_data: "Veri Girilmemiş",
    mode_inv: "eksenleri yer değiştirilmiş analiz (x=laktat, y=iş yükü)",
    mode_norm: "düz regresyon (x=iş yükü, y=laktat) + ters kestirim (f(x)=y)",
    res_degree: function(deg, n) { return "Polinominal Regresyon Denkleminin Derecesi " + deg + ", " + n + " adet x,y veri çifti.\n"; },
    res_r2: "Korelasyon Katsayısı (r^2) = ",
    res_see: "Kestirimin Standart Hatası = ",
    res_coeff: "Katsayı Çıktı Formu ",
    res_credit: "\nCopyright (c) 2014, R. IRMAK -- Kan Laktat Eşiği Uyarlaması\n",
    res_lactate: "\nLaktat Eşiği İş Yükü Kestirimleri:\n",
    res_th_label: function(mmol, val) { return "  " + mmol + " mmol/L Laktat Eşiği = " + val + "\n"; },
    graph_win_title: "Polynomial Regression Grafiği"
  },
  en: {
    page_title: "Blood Lactate Threshold Calculator",
    main_heading: "Polynomial Regression Models of Blood Lactate Threshold",
    copyright_1: "Copyright © 2013, P. Lutus — Adapted from JavaScript PolySolve (07.20.2013)",
    copyright_2: "Copyright © 2014, Adapted by Rafet IRMAK",
    subtopic: "Blood Lactate Threshold Calculator",
    lang_btn: "🇹🇷 TR",
    data_entry_label: "Data Entry (Workload Blood Lactate):",
    shortcuts: "Select: Ctrl+A | Copy: Ctrl+C | Paste: Ctrl+V",
    curve_title: "Workload Blood Lactate Curve:",
    curve_hint: "To see calculated lactate and workload values, move the mouse over the graph while holding the left button.",
    reverse_label: "Swap Axes (x,y -> y,x)",
    degree_label: "Degree of Polynomial Regression Model:",
    btn_best_fit: "Best Fit",
    btn_solve: "Solve",
    btn_output: "Output",
    btn_graph: "Graph",
    result_heading: "Result:",
    result_explanation: "<br> The Regression Model fits the physiological workload (x) – lactate (y) relationship (y = f(x)) and calculates the workloads corresponding to fixed blood lactate thresholds (2.0, 2.5, and 4.0 mmol/L) by solving the fitted equation in reverse (inverse prediction).<br>",
    table_heading: "Table:",
    tbl_start: "Initial:",
    tbl_end: "Final:",
    tbl_step: "Step:",
    tbl_decimals: "Decimal:",
    tbl_exp: "Exponential",
    btn_create_table: "Create Table",
    form_labels: ['basic list', 'equation', 'C/C++ function', 'Java Function'],
    wheel_title: "Change values using the mouse wheel.",
    chart_title: function(n, deg) { return "Degree " + deg + " polynomial fitted to " + n + " data points"; },
    err_range: "Error: Number Range",
    err_mismatch: "Mismatched Data (number of x != number of y).",
    err_no_data: "No Data Entered",
    mode_inv: "axis-swapped regression (x=lactate, y=workload)",
    mode_norm: "forward regression (x=workload, y=lactate) + inverse prediction (f(x)=y)",
    res_degree: function(deg, n) { return "Degree of polynomial regression equation " + deg + ", number of (x,y) couples " + n + "\n"; },
    res_r2: "Correlation coefficient (r^2) = ",
    res_see: "Standard error of estimate = ",
    res_coeff: "Coefficients ",
    res_credit: "\nCopyright (c) 2014, R. IRMAK -- Blood lactate threshold adaptation\n",
    res_lactate: "\nLactate Threshold Workload Estimates:\n",
    res_th_label: function(mmol, val) { return "  " + mmol + " mmol/L Lactate Threshold = " + val + "\n"; },
    graph_win_title: "Polynomial Regression Graph"
  }
};

poly.detectLanguage = function() {
  try {
    var urlParams = new URLSearchParams(window.location.search);
    var urlLang = urlParams.get('lang');
    if (urlLang === 'tr' || urlLang === 'en') return urlLang;
  } catch (e) {}
  if (window.location.pathname.indexOf('lth_en') !== -1) return 'en';
  var htmlLang = document.documentElement.getAttribute('lang');
  if (htmlLang === 'en') return 'en';
  return 'tr';
};

poly.lang = 'tr';
poly.form_labels = poly.i18n.tr.form_labels;

poly.setText = function(id, text, isHtml) {
  var el = poly.id(id);
  if (el) {
    if (isHtml) el.innerHTML = text;
    else el.innerText = text;
  }
};

poly.updateLanguage = function() {
  var t = poly.i18n[poly.lang] || poly.i18n.tr;
  poly.form_labels = t.form_labels;
  document.documentElement.setAttribute('lang', poly.lang);
  document.title = t.page_title;
  poly.setText('txt_page_title', t.page_title);
  poly.setText('txt_main_heading', t.main_heading);
  poly.setText('txt_copyright_1', t.copyright_1);
  poly.setText('txt_copyright_2', t.copyright_2);
  poly.setText('txt_subtopic', t.subtopic);
  poly.setText('btn_lang', t.lang_btn);
  poly.setText('txt_data_entry_label', t.data_entry_label);
  poly.setText('txt_shortcuts_1', t.shortcuts);
  poly.setText('txt_shortcuts_2', t.shortcuts);
  poly.setText('txt_shortcuts_3', t.shortcuts);
  poly.setText('txt_curve_title', t.curve_title);
  poly.setText('txt_curve_hint', t.curve_hint);
  poly.setText('txt_reverse_label', t.reverse_label);
  poly.setText('txt_degree_label', t.degree_label);
  poly.setText('txt_btn_best_fit', t.btn_best_fit);
  poly.setText('txt_btn_solve', t.btn_solve);
  poly.setText('txt_btn_output', t.btn_output);
  poly.setText('txt_btn_graph', t.btn_graph);
  poly.setText('txt_result_heading', t.result_heading);
  poly.setText('txt_result_explanation', t.result_explanation, true);
  poly.setText('txt_table_heading', t.table_heading);
  poly.setText('txt_tbl_start', t.tbl_start);
  poly.setText('txt_tbl_end', t.tbl_end);
  poly.setText('txt_tbl_step', t.tbl_step);
  poly.setText('txt_tbl_decimals', t.tbl_decimals);
  poly.setText('txt_tbl_exp', t.tbl_exp);
  poly.setText('txt_btn_create_table', t.btn_create_table);
  poly.set_title_strings();
};

poly.toggleLanguage = function() {
  poly.lang = (poly.lang === 'tr') ? 'en' : 'tr';
  try {
    var newUrl = new URL(window.location);
    newUrl.searchParams.set('lang', poly.lang);
    window.history.pushState({}, '', newUrl);
  } catch (e) {}
  poly.updateLanguage();
  poly.generate_result();
};

// All that typing!

poly.id = function(s) {
  return document.getElementById(s);
}

poly.float_id = function(s) {
  return parseFloat(poly.id(s).value);
}

poly.set_wh = function(obj,w,h) {
  obj.style.width = w + "px";
  obj.style.height = h + "px";
}

poly.resize_graph = function() {
  poly.chart_width = 860;
  poly.chart_height = 500;
  poly.set_wh(poly.chart_wrapper,poly.chart_width,poly.chart_height);
  poly.set_wh(poly.canvas,poly.chart_width,poly.chart_height);
  poly.canvas.width = poly.chart_width;
  poly.canvas.height = poly.chart_height;
  poly.set_wh(poly.text_div,poly.chart_width,poly.chart_height);
}

poly.resize_plot = function() {
  poly.resize_graph();
  poly.plot_graph();
}

poly.set_title_strings = function() {
  var ob,class_name,ident,i;
  var t = poly.i18n[poly.lang] || poly.i18n.tr;
  var array = document.getElementsByTagName("input");
  for(i = 0;i < array.length;i++) {
    ob = array[i];
    class_name = ob.className;
    ident = ob.id;
    if ((class_name.match(/input_field/i))
      && ! (ident.match(/equation/i))
      ) {
      ob.title = t.wheel_title;
    }
  }
}

poly.hide_show_divs = function(array,show) {
  for(var i = 0;i < array.length;i++) {
    var div = poly.id(array[i]);
    div.className = (show)?"visible_class":"hidden_class";
  }
}

poly.open_edit_div = function() {
  var target = poly.id("edit_div");
  target.className = "edit_div"; // from "hidden_class"
}

poly.open_comment_list = function() {
  poly.hide_show_divs(["comment_wrapper"],true);
}

poly.close_comment_list = function() {
  poly.hide_show_divs(["comment_wrapper"],false)
}

poly.decode_example = function(s) {
  var data = "";
  eval("data = example_" + s);
  poly.decode_piped_list(data);
}

poly.launch_example = function(s) {
  poly.decode_example(s);
  poly.plot_graph();
  window.location.href = "#x_scrolldown";
}

poly.reset_normal = function() {
  window.location.href = bare_url(window.location.href);
}

poly.decode_queries = function() {
  var result = [];
  var path = window.location.href;
  var args = path.replace(/^(.*?)(\?|$)(.*)/,"$3");
  args = strip_whitespace(args);
  if(args.length > 0) {
    var array = args.split("&");
    for(var i = 0;i < array.length;i++) {
      var pair = array[i].split("=");
      if(pair.length == 2) {
        result[strip_whitespace(pair[0])] = strip_whitespace(pair[1]);
      }
    }
  }
  return result;
}

poly.init = function() {
  poly.lang = poly.detectLanguage();
  poly.updateLanguage();

  document.onmousedown = poly.mouse_down;
  document.onmouseup = poly.mouse_up;
  document.onmousemove = poly.mouse_move;
  
  poly.canvas = poly.id("graphicPane1");
  poly.canvas_ctx = poly.canvas.getContext("2d");
  poly.text_div = poly.id("textPane1");
  poly.chart_wrapper = poly.id("chart_wrapper");
  poly.control_panel = poly.id("control_panel");
  poly.resize_graph();
  poly.set_title_strings();
  poly.adjust_degree();
}

poly.mouse_handler = function(event) {
  if(poly.mousedown) {
    if(!event) {
      event = window.event;
    }
    var target;
    if(event.target) {
      target = event.target;
    }
    else if (event.srcElement) {
      target = event.srcElement;
    }
    if (target.nodeType == 3) { // defeat Safari bug
      target = target.parentNode;
    }
    // When the canvas emulator is in use,
    // the lines on the graph are not normal HTML
    // objects. They belong to G_vml_.
    // So:
    if(target.id == "textPane1" ||
      target.id == "graphicPane1" ||
      target.id == "text_span" ||
      target.scopeName == "g_vml_") {
      // draw a crosshair and values
      var xpos = (event.layerX)?event.layerX:event.x;
      poly.draw_mouse_query(xpos);
      return false;
    }
  }
  return true;
}

poly.mouse_down = function(event) {
  poly.mousedown = true;
  return poly.mouse_handler(event);
}

poly.mouse_move = function(event) {
  if(poly.mousedown) {
    poly.plot_graph();
    return poly.mouse_handler(event);
  }
}

poly.mouse_up = function() {
  poly.mousedown = false;
  poly.plot_graph();
  return false;
}

poly.draw_line = function(x1,y1,x2,y2) {
  try {
    poly.canvas_ctx.moveTo(x1,y1);
    poly.canvas_ctx.lineTo(x2,y2);
  }
  catch(err) {
    poly.error_flag = true;
  }
}

// interpolate x from xa,xb -> ya,yb

poly.ntrp = function(xa,xb,ya,yb,x) {
  var q = xb-xa;
  if(q == 0) return 0;
  return ((x-xa) * (yb-ya))/q + ya;
}

poly.plot_grid = function() {
  poly.canvas_ctx.beginPath();
  var px,py;
  var ox = null;
  var oy = null;
  poly.canvas_ctx.strokeStyle = poly.grid_color;
  for (var x = 0;x <= poly.x_axis_data.steps; x++) {
    px = poly.ntrp(0,poly.x_axis_data.steps,poly.graph_dims.xl,poly.graph_dims.xh,x);
    // deal with a perfectly insane canvas bug
    px = parseInt(px) + 0.5;
    poly.draw_line(px,poly.graph_dims.yl,px,poly.graph_dims.yh);
  }
  for (var y = 0;y <= poly.y_axis_data.steps; y++) {
    py = poly.ntrp(0,poly.y_axis_data.steps,poly.graph_dims.yl,poly.graph_dims.yh,y);
    // deal with a perfectly insane canvas bug (again)
    py = parseInt(py) + 0.5;
    poly.draw_line(poly.graph_dims.xl,py,poly.graph_dims.xh,py);
  }
  poly.canvas_ctx.stroke();
  poly.canvas_ctx.closePath();
}

poly.plot_points = function() {
  var fc = Math.PI * 2;
  poly.canvas_ctx.fillStyle = poly.point_color;
  poly.canvas_ctx.lineWidth = 2;
  poly.canvas_ctx.beginPath();
  for(var i = 0; i < poly.xy_data.length;i++) {
    var pr = poly.xy_data[i];
    var px = poly.ntrp(poly.x_axis_data.gmin,poly.x_axis_data.gmax,poly.graph_dims.xl,poly.graph_dims.xh,pr.x);
    var py = poly.ntrp(poly.y_axis_data.gmin,poly.y_axis_data.gmax,poly.graph_dims.yh,poly.graph_dims.yl,pr.y);
    poly.canvas_ctx.moveTo(px,py);
    poly.canvas_ctx.arc(px,py,3,0,fc);
    poly.canvas_ctx.fill();
  }
  poly.canvas_ctx.closePath();
}

poly.plot_function = function() {
  poly.canvas_ctx.strokeStyle = poly.plot_color;
  poly.canvas_ctx.beginPath();
  var x,px;
  var y,py;
  var first = true;
  var incr = (poly.x_axis_data.max-poly.x_axis_data.min)/poly.plot_steps;
  for(x = poly.x_axis_data.min;!poly.error_flag && x <= poly.x_axis_data.max;x += incr) {
    px = poly.ntrp(poly.x_axis_data.gmin,poly.x_axis_data.gmax,poly.graph_dims.xl,poly.graph_dims.xh,x);
    y = matf.regress(x,poly.poly_terms);
    py = poly.ntrp(poly.y_axis_data.gmin,poly.y_axis_data.gmax,poly.graph_dims.yh,poly.graph_dims.yl,y);
    try {
      if(first) {
        poly.canvas_ctx.moveTo(px,py);
      }
      else {
        poly.canvas_ctx.lineTo(px,py);
      }
    }
    catch(err) {
      poly.error_flag = true;
    }
    first = false;
  }
  poly.canvas_ctx.stroke();
  poly.canvas_ctx.closePath();
}

poly.clearChildren = function(obj)
{
  try {
    if(obj.hasChildNodes() && obj.childNodes) {
      while(obj.firstChild) {
        obj.removeChild(obj.firstChild);
      }
    }
  }
  catch(e) {
  }
}

poly.create_text_span = function(s,ps) {
  var tsp = document.createElement('span');
  tsp.id = "text_span";
  var ts = tsp.style;
  ts.fontSize = ps;
  ts.whiteSpace = "nowrap";
  ts.fontFamily = "monospace";
  var tn = document.createTextNode(s);
  tsp.appendChild(tn);
  return tsp;
}

poly.create_index_span = function(parent,str,x,y,max,align,ps) {
  var tsp = poly.create_text_span(str,ps);
  parent.appendChild(tsp);
  var ts = tsp.style;
  ts.position = "absolute";
  ts.textAlign = align;
  ts.width = (max*8) + "px"
  ts.left = x + "px";
  ts.top = y + "px";
}

poly.gen_y_index = function(obj) {
  var text_delta = 8;
  var maxw = poly.y_axis_data.label.length;
  var w;
  var array = [];
  for(var i = 0;i <= poly.y_axis_data.steps;i++) {
    var y = poly.ntrp(0,poly.y_axis_data.steps,poly.y_axis_data.gmin,poly.y_axis_data.gmax,i);
    var py = poly.ntrp(0,poly.y_axis_data.steps,poly.graph_dims.yh,poly.graph_dims.yl,i);
    var sy = y.toFixed(2);
    array.push(sy + "\t" + py);
    w = ("" + sy).length;
    maxw = (w > maxw)?w:maxw;
  }
  poly.create_index_span(obj,poly.y_axis_data.label,4,poly.graph_dims.yl-poly.text_delta-16,maxw,"right",poly.default_font_size);
  var pair;
  for(var i = 0;i < array.length;i++) {
    pair = array[i].split("\t");
    poly.create_index_span(obj,pair[0],4,pair[1]-text_delta,maxw,"right",poly.default_font_size);
  }
  poly.graph_dims.xl += (maxw * 8);
}

poly.gen_x_index = function(obj) {
  var deltax = 0;
  var maxw = poly.x_axis_data.label.length;
  var text_delta = 6;
  var w;
  var array = [];
  for(var x = 0;x <= poly.x_axis_data.steps;x++) {
    var px = poly.ntrp(0,poly.x_axis_data.steps,poly.x_axis_data.gmin,poly.x_axis_data.gmax,x);
    var sx = px.toFixed(2);
    array.push(sx + "\t" + px);
    w = ("" + sx).length;
    maxw = (w > maxw)?w:maxw;
  }
  var len = poly.x_axis_data.label.length;
  var maxx = (maxw > len)?len:maxw;
  poly.graph_dims.xh -= maxx * 8;
  var pair;
  for(var i = 0;i < array.length;i++) {
    pair = array[i].split("\t");
    var px = poly.ntrp(poly.x_axis_data.gmin,poly.x_axis_data.gmax,poly.graph_dims.xl,poly.graph_dims.xh,pair[1]);
    poly.create_index_span(obj,pair[0],px-maxw*4,poly.graph_dims.yh+text_delta,maxw,"center",poly.default_font_size);
  }
  poly.create_index_span(obj,poly.x_axis_data.label,poly.graph_dims.xh+24,poly.graph_dims.yh+text_delta,maxx,"right",poly.default_font_size);
}

poly.graph_indices = function() {
  if(poly.text_div != null) {
    if(poly.y_axis_data.nums) {
      poly.gen_y_index(poly.text_div);
    } // x axis index
    if(poly.chart_title.length > 0) {
      var title = poly.chart_title;
      var center = (poly.graph_dims.xl + poly.graph_dims.xh-(title.length*10))/2;
      poly.create_index_span(poly.text_div,title,center,4,title.length,"center","100%");
    }
    if(poly.x_axis_data.nums) {
      poly.gen_x_index(poly.text_div);
    } // y axis index
  } // text_div != null
} // graph_title()

poly.set_dimensions = function() {
  var bottom = poly.canvas.height - poly.bottom_margin;
  var left = poly.left_margin + ((poly.x_axis_data.nums)?16:0);
  var right = poly.canvas.width - poly.right_margin - ((poly.x_axis_data.nums)?16:0);
  var top = poly.top_margin + ((poly.chart_title.length > 0 || poly.y_axis_data.nums)?20:0);
  poly.graph_dims = new graph_dim_class(left,right,top,bottom);
}

poly.update_axis_data = function() {
  poly.linewidth = 1;
  poly.chart_title = "";
  var t = poly.i18n[poly.lang] || poly.i18n.tr;
  if(poly.xy_data != null) {
    poly.chart_title = t.chart_title(poly.xy_data.length, poly.poly_degree);
  }
}

poly.valid_test = function() {
  return (poly.xy_data != null);
}

poly.plot_graph = function() {
  if (!poly.valid_test()) {
    return false;
  }
  poly.clearChildren(poly.text_div);
  poly.canvas_ctx.clearRect(0, 0, poly.canvas.width, poly.canvas.height);
  poly.update_axis_data();
  if((poly.x_axis_data.max > poly.x_axis_data.min) &&
    (poly.y_axis_data.max > poly.y_axis_data.min) &&
    poly.x_axis_data.increm > 0 &&
    poly.y_axis_data.increm > 0 &&
    poly.plot_steps > 0) {
    poly.error_flag = false;
    poly.set_dimensions();
    poly.graph_indices();
    if(!poly.error_flag) {
      poly.canvas_ctx.globalAlpha = 1;
      poly.canvas_ctx.lineWidth = "" + poly.linewidth;
      poly.canvas_ctx.lineCap = "round";
      poly.plot_grid();
      poly.plot_points();
      poly.plot_function();
    }
  }
  else { // range error
    var t = poly.i18n[poly.lang] || poly.i18n.tr;
    poly.show_graph_error(t.err_range);
  }
  poly.show_results();
  return true;
}

poly.show_graph_error = function(str) {
  poly.clearChildren(poly.text_div);
  poly.canvas_ctx.clearRect(0, 0, poly.canvas.width, poly.canvas.height);
  var xm = poly.canvas.width/2;
  var ym = poly.canvas.height/2;
  poly.create_index_span(poly.text_div,'Note: ' + str,xm-(str.length*4),ym,str.length,"center","120%");
}

poly.draw_mouse_query = function(x) {
  poly.canvas_ctx.lineWidth = 1;
  var fx = poly.ntrp(poly.graph_dims.xl,poly.graph_dims.xh,poly.x_axis_data.gmin,poly.x_axis_data.gmax,x);
  var y = matf.regress(fx,poly.poly_terms);
  var px = poly.ntrp(poly.x_axis_data.gmin,poly.x_axis_data.gmax,poly.graph_dims.xl,poly.graph_dims.xh,fx);
  px = parseInt(px) + 0.5;
  var py = poly.ntrp(poly.y_axis_data.gmin,poly.y_axis_data.gmax,poly.graph_dims.yh,poly.graph_dims.yl,y);
  py = parseInt(py) + 0.5;
  poly.canvas_ctx.strokeStyle = poly.explore_color;
  poly.canvas_ctx.beginPath();
  poly.draw_line(poly.graph_dims.xl,py,poly.graph_dims.xh,py);
  poly.draw_line(px,poly.graph_dims.yl,px,poly.graph_dims.yh);
  poly.canvas_ctx.stroke();
  poly.canvas_ctx.closePath();
  var str = "x = " + fx.toFixed(6) + ", y = " + y.toFixed(6);
  // decide where to put the number tag
  if(fx > (poly.x_axis_data.min+poly.x_axis_data.max)/2) {
    px -= (str.length * 8) + 4;
  }
  else {
    px += 8;
  }
  if(y < (poly.y_axis_data.min+poly.y_axis_data.max)/2) {
    py -= 20;
  }
  else {
    py += 4;
  }
  poly.create_index_span(poly.text_div,str,px,py,str.length,"left",poly.default_font_size);
}

poly.adjust_degree = function(w) {
  poly.reverse_xy = false;
  poly.read_data();
  if(w != null) {
    poly.poly_degree += parseFloat(w);
  }
  poly.poly_degree = Math.max(1,poly.poly_degree);
  if(poly.xy_data != null) {
    poly.poly_degree = Math.min(3,poly.xy_data.length-1,poly.poly_degree);
  }
  poly.compute_polynomial();
  poly.plot_graph();
}

poly.read_data = function() {
  var t = poly.i18n[poly.lang] || poly.i18n.tr;
  poly.xy_data = null;
  var xl = 1e30;
  var xh = -1e30;
  var yl = 1e30;
  var yh = -1e30;
  var sd = poly.id('data_entry').value;
  // try to filter numerical data from an arbitrary input
  var strings = sd.match(/([0-9\.e+-]+)/gim,"$1");
  if(strings != null && strings.length > 0) {
    var array = [];
    for(var i = 0; i < strings.length; i++) {
      var s = strings[i];
      // only if the string contains at least one numerical digit
      if(s.match(/.*[0-9].*/)) {
        array.push(parseFloat(strings[i]));
      }
    }
    var len = array.length;
    if(len % 2 != 0) {
      poly.show_graph_error(t.err_mismatch);
      return false;
    }
    else {
      poly.xy_data = new Array();
      var x, y;
      for(var i = 0;i < len;i += 2) {
        if(poly.reverse_xy) {
          x = parseFloat(array[i+1]);
          y = parseFloat(array[i]);
        }
        else {
          x = parseFloat(array[i]);
          y = parseFloat(array[i+1]);
        }
        xl = Math.min(x,xl);
        xh = Math.max(x,xh);
        yl = Math.min(yl,y);
        yh = Math.max(yh,y); 
        poly.xy_data.push(new Pair(x,y));
      }
      poly.x_axis_data = new axis_data_class(xl,xh,12,'x',true);
      poly.y_axis_data = new axis_data_class(yl,yh,8,'y',true);
      // 4 mmol laktat etrafının belirlenmesi için başlangıç bitiş ve step değerleri
      poly.id("table_start").value = 3.5;
      poly.id("table_end").value = 4.5;
      poly.id("table_step").value = 0.25;
    }
  }
  else {
    poly.show_graph_error(t.err_no_data);
    return false;
  }
  return true;
}

poly.compute_polynomial = function() {
  if(!poly.valid_test()) {
    return false;
  }
  poly.id("poly_degree_field").innerHTML = poly.poly_degree
  var result = matf.process_data(poly.xy_data,poly.poly_degree);
  poly.poly_terms = result[0];
  poly.correlation_coefficient = result[1];
  poly.standard_error = result[2];
  return true;
}

poly.generate_result = function() {
  poly.read_data();
  poly.compute_polynomial();
  poly.plot_graph();
}

poly.set_optimum = function() {
  poly.read_data();
  poly.poly_degree = Math.min(3, poly.xy_data.length - 1);
  poly.compute_polynomial();
  poly.plot_graph();
}

poly.change_output_form = function() {
  poly.output_form = (poly.output_form += 1) % 4;
  poly.generate_result();
}

poly.show_results = function() {
  var t = poly.i18n[poly.lang] || poly.i18n.tr;
  var results = "Mode: " + (poly.reverse_xy ? t.mode_inv : t.mode_norm) + "\n";
  results += t.res_degree(poly.poly_degree, poly.xy_data.length);
  results += t.res_r2 + poly.correlation_coefficient.toFixed(3) + "\n";
  results += t.res_see + poly.standard_error.toFixed(3) + "\n";
  results += t.res_coeff + poly.form_labels[poly.output_form] + ":\n\n";
  results += poly.parse_results();
  poly.id("results_area").value = results;
  poly.generate_table();
}

poly.fix_exponent = function(v) {
  v = v.toExponential(16);
  var exp = v.replace(/.*e[+-](\d+)$/,"$1");
  while(exp.length < 3) {
    exp = '0' + exp;
  }
  v = v.replace(/(.*e[+-])(\d+)$/,"$1" + exp);
  return v;
}

poly.parse_results = function() {
  var t = poly.i18n[poly.lang] || poly.i18n.tr;
  var indent = [26,37,45,50];
  var iv = indent[poly.output_form];
  var result = "";
  var len = poly.poly_terms.length;
  var v, row, s;
  
  for (var i = 0;i < len;i++) {
    v = poly.poly_terms[i];
    v = poly.fix_exponent(v);
    v = poly.right_align(v,24);
    switch(poly.output_form) {
      case 0:
        row = v;
        break;
      case 1:
        s = (i == 0)?"f(x) = ":"+ ";
        row = s + v + " * x^" + i;
        break;
      case 2:
        s = (i == 0)?"return ":"+ ";
        row = s + v + " * pow(x," + i + ")";
        break;
      case 3:
        s = (i == 0)?"return ":"+ ";
        row = s + v + " * Math.pow(x," + i + ")";
        break;
    }
    row = poly.right_align(row,iv);
    row += (i == len-1 && poly.output_form > 1)?";\n":"\n";
    result += row;
  }
  switch(poly.output_form) {
    case 2:
    case 3:
      result = "double f(double x) {\n" + result + "}\n";
      break;
  }
  
  var t20 = poly.reverse_xy ? matf.regress(2.0, poly.poly_terms) : matf.find_threshold(2.0, poly.poly_terms, poly.xy_data);
  var t25 = poly.reverse_xy ? matf.regress(2.5, poly.poly_terms) : matf.find_threshold(2.5, poly.poly_terms, poly.xy_data);
  var t40 = poly.reverse_xy ? matf.regress(4.0, poly.poly_terms) : matf.find_threshold(4.0, poly.poly_terms, poly.xy_data);

  result += "\nCopyright (c) 2013, P. Lutus -- http://arachnoid.com. All Rights Reserved.\n";
  result += t.res_credit;
  result += t.res_lactate;
  result += t.res_th_label("2.0", t20.toFixed(2));
  result += t.res_th_label("2.5", t25.toFixed(2));
  result += t.res_th_label("4.0", t40.toFixed(2));
  return result;
}

poly.right_align = function(s,n) {
  while(s.length < n) {
    s = " " + s;
  }
  return s
}

poly.create_table_row = function(x,start,end,decimals,exp) {
  var y = poly.reverse_xy ? matf.regress(x,poly.poly_terms) : matf.find_threshold(x,poly.poly_terms,poly.xy_data);
  var pct = poly.ntrp(start,end,0,100,x);
  var xs,ys,pcs;
  if(exp) {
    xs = x.toExponential(decimals);
    ys = y.toExponential(decimals);
    pcs = pct.toExponential(decimals);
  }
  else {
    xs = x.toFixed(decimals);
    ys = y.toFixed(decimals);
    pcs = pct.toFixed(decimals);
  }
  return xs + "," + ys + "," + pcs + "\n";
}

poly.generate_table = function() {
  var t = poly.i18n[poly.lang] || poly.i18n.tr;
  var exp = false;
  var start = poly.float_id("table_start");
  var end = poly.float_id("table_end");
  var step = poly.float_id("table_step");
  var decimals = poly.float_id("table_decimals");
  var result = (poly.lang === 'en') ? "Lactate (mmol/L),Workload,%\n" : "Laktat (mmol/L),İş Yükü,%\n";
  var row = "";
  for(var x = start; x <= end;x += step) {
    row = poly.create_table_row(x,start,end,decimals,exp);
    result += row;
  }
  var lastrow = poly.create_table_row(end,start,end,decimals,exp);
  if(lastrow != row) {
    result += lastrow;
  }
  poly.id("table_results_area").value = result;
}

poly.generate_graphic = function() {
  var t = poly.i18n[poly.lang] || poly.i18n.tr;
  var dataURL = poly.canvas.toDataURL("image/png");
  window.open(dataURL, t.graph_win_title);
};

addEvent(window,'load',poly.init);

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

poly.output_form = 0;

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

poly.form_labels = ['basic list','equation','C/C++ function','Java Function']

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
  array = document.getElementsByTagName("input");
  for(i = 0;i < array.length;i++) {
    ob = array[i];
    var class_name = ob.className;
    poly.ident = ob.id;
    if ((class_name.match(/input_field/i))
      && ! (ident.match(/equation/i))
      // && ! (ident.match(/chart(Width|Height)/i))
      ) {
      ob.title = "Değerleri Fare Tekerleğini Kullanarak Değiştirin.";
    }
  }
}

poly.hide_show_divs = function(array,show) {
  for(var i = 0;i < array.length;i++) {
    div = poly.id(array[i]);
    div.className = (show)?"visible_class":"hidden_class";
  }
}

poly.open_edit_div = function() {
  var target = id("edit_div");
  target.className = "edit_div"; // from "hidden_class"
}

poly.open_comment_list = function() {
  hide_show_divs(["comment_wrapper"],true);
}

poly.close_comment_list = function() {
  hide_show_divs(["comment_wrapper"],false)
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
  result = [];
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
    error_flag = true;
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
  fc = Math.PI * 2;
  poly.canvas_ctx.fillStyle = poly.point_color;
  poly.canvas_ctx.lineWidth = 2;
  poly.canvas_ctx.beginPath();
  for(var i = 0; i < poly.xy_data.length;i++) {
    pr = poly.xy_data[i];
    px = poly.ntrp(poly.x_axis_data.gmin,poly.x_axis_data.gmax,poly.graph_dims.xl,poly.graph_dims.xh,pr.x);
    py = poly.ntrp(poly.y_axis_data.gmin,poly.y_axis_data.gmax,poly.graph_dims.yh,poly.graph_dims.yl,pr.y);
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
    y = poly.ntrp(0,poly.y_axis_data.steps,poly.y_axis_data.gmin,poly.y_axis_data.gmax,i);
    //for(var y = y_axis_data.gmin;y <= y_axis_data.gmax;y += y_axis_data.increm) {
    py = poly.ntrp(0,poly.y_axis_data.steps,poly.graph_dims.yh,poly.graph_dims.yl,i);
    var sy = y.toFixed(2);
    array.push(sy + "\t" + py);
    w = ("" + sy).length;
    maxw = (w > maxw)?w:maxw;
  }
  poly.create_index_span(obj,poly.y_axis_data.label,4,poly.graph_dims.yl-poly.text_delta-16,maxw,"right",poly.default_font_size);
  var pair;
  for(i = 0;i < array.length;i++) {
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
  for(x = 0;x <= poly.x_axis_data.steps;x++) {
    //for(var x = x_axis_data.gmin;x <= x_axis_data.gmax;x += x_axis_data.increm) {
    px = poly.ntrp(0,poly.x_axis_data.steps,poly.x_axis_data.gmin,poly.x_axis_data.gmax,x);
    sx = px.toFixed(2);
    array.push(sx + "\t" + px);
    w = ("" + sx).length;
    maxw = (w > maxw)?w:maxw;
  }
  var len = poly.x_axis_data.label.length;
  var maxx = (maxw > len)?len:maxw;
  poly.graph_dims.xh -= maxx * 8;
  for(i = 0;i < array.length;i++) {
    pair = array[i].split("\t");
    px = poly.ntrp(poly.x_axis_data.gmin,poly.x_axis_data.gmax,poly.graph_dims.xl,poly.graph_dims.xh,pair[1]);
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
      var title = poly.chart_title;//.replace(/\?/,plot_function_2d);
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

//function retrieve_axis_data(s) {
//  var q = new axis_data_class(
//    -10,//retrieve_control_number(s + "Min2DLineEdit"),
//    10,//retrieve_control_number(s + "Max2DLineEdit"),
//    10,//retrieve_control_number(s + "GridStepsLineEdit"),
//    s,//retrieve_control_value(s + "LabelLineEdit"),
//    true//retrieve_control_value(s + "IndexCheckBox")
//  );
//  return q;
//}

poly.update_axis_data = function() {
  //x_axis_data = retrieve_axis_data("x");
  //y_axis_data =  retrieve_axis_data("y");
  poly.linewidth = 1;//retrieve_control_number("lineThicknessLineEdit");
  //control_a_var = 4;//retrieve_control_number("controlALineEdit");
  //control_b_var = 1;//retrieve_control_number("controlBLineEdit");
  //control_c_var = 1;//retrieve_control_number("controlCLineEdit");
  //plot_steps = 500;//retrieve_control_number("plotStepsLineEdit");
  //plot_function_2d = "for(n=1;n <= a;n++) { q=2*n-1; y += sin(x*q)/q }; y * 4/PI";//retrieve_control_value("equation2DLineEdit");
  poly.chart_title = "";
  if(poly.xy_data != null) {
    poly.chart_title =  poly.xy_data.length + " adet veri noktasi ile olusturulmus " + poly.poly_degree + ". dereceden Polynominal";
    //chart_title = chart_title.replace(/\?/,plot_function_2d);
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
    error_flag = false;
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
    poly.show_graph_error("Hata: Sayi Araligi");
  }
  poly.show_results();
  return true;
}

poly.show_graph_error = function(str) {
  clearChildren(text_div);
  poly.canvas_ctx.clearRect(0, 0, poly.canvas.width, poly.canvas.height);
  var xm = poly.canvas.width/2;
  var ym = poly.canvas.height/2;
  poly.create_index_span(text_div,'Note: ' + str,xm-(str.length*4),ym,str.length,"center","120%");
}

poly.draw_mouse_query = function(x) {
  poly.canvas_ctx.lineWidth = 1;
  var fx = poly.ntrp(poly.graph_dims.xl,poly.graph_dims.xh,poly.x_axis_data.gmin,poly.x_axis_data.gmax,x);
  y = matf.regress(fx,poly.poly_terms);
  px = poly.ntrp(poly.x_axis_data.gmin,poly.x_axis_data.gmax,poly.graph_dims.xl,poly.graph_dims.xh,fx);
  px = parseInt(px) + 0.5;
  py = poly.ntrp(poly.y_axis_data.gmin,poly.y_axis_data.gmax,poly.graph_dims.yh,poly.graph_dims.yl,y);
  py = parseInt(py) + 0.5;
  poly.canvas_ctx.strokeStyle = poly.explore_color;
  poly.canvas_ctx.beginPath();
  poly.draw_line(poly.graph_dims.xl,py,poly.graph_dims.xh,py);
  poly.draw_line(px,poly.graph_dims.yl,px,poly.graph_dims.yh);
  poly.canvas_ctx.stroke();
  poly.canvas_ctx.closePath();
  str = "x = " + fx.toFixed(6) + ", y = " + y.toFixed(6);
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
  poly.reverse_xy = poly.id("reverse_checkbox").checked;
  poly.read_data();
  if(w != null) {
    poly.poly_degree += parseFloat(w);
  }
  poly.poly_degree = Math.max(0,poly.poly_degree);
  if(poly.xy_data != null) {
    poly.poly_degree = Math.min(poly.xy_data.length-1,poly.poly_degree);
  }
  poly.compute_polynomial();
  poly.plot_graph();
}

poly.read_data = function() {
  poly.xy_data = null;
  var xl = 1e30;
  var xh = -1e30;
  var yl = 1e30;
  var yh = -1e30;
  var sd = poly.id('data_entry').value;
  // try to filter numerical data from an arbitrary input
  var strings = sd.match(/([0-9\.e+-]+)/gim,"$1");
  if(strings != null && strings.length > 0) {
    array = [];
    for(var i in strings) {
      s = strings[i];
      // only if the string contains at least one numerical digit
      if(s.match(/.*[0-9].*/)) {
        array.push(parseFloat(strings[i]));
      }
    }
    var len = array.length;
    if(len % 2 != 0) {
      poly.show_graph_error("Uyusmayan Veri (x sayısı != y sayısı).");
      return false;
    }
    else {
      //console.debug(array);
      poly.xy_data = new Array();
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
            // rafet ben yaptım, 4 mmol laktat etrafının belirlenmesi için başlangıç bitiş ve step değerlerini deiştirdim
     /* poly.id("table_start").value = xl;
      poly.id("table_end").value = xh;
      poly.id("table_step").value = (xh-xl) / 20.0; */
        
      poly.id("table_start").value = 3.5;
      poly.id("table_end").value = 4.5;
      poly.id("table_step").value = 0.25;
    }
  }
  else {
    poly.show_graph_error("Veri Girilmemis");
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
  if(false) {
    for(var i = 0;i < poly.poly_terms.length;i++) {
      console.debug(terms[i]);
    }
    console.debug(result[1]);
    console.debug(result[2]);
  }
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
  poly.poly_degree = poly.xy_data.length - 1;
  poly.compute_polynomial();
  poly.plot_graph();
}

poly.change_output_form = function() {
  poly.output_form = (poly.output_form += 1) % 4;
  poly.generate_result();
}

poly.show_results = function() {
  var results = "Mode: " + (poly.reverse_xy?"inverse regression analysis (y,x) ":"regression analysis (x,y)") + "\n";
  results += "Degree of polynıminal regression equation " + poly.poly_degree + ",  number of (x,y)couples " + poly.xy_data.length + "\n";
  results += "Correlation coefficient (r^2) = " + poly.correlation_coefficient.toFixed(3) + "\n";
  results += "Standard error of estimate = " + poly.standard_error.toFixed(3) + "\n";
  results += "Coefficients " + poly.form_labels[poly.output_form] + ":\n\n";
  results += poly.parse_results();
  poly.id("results_area").value = results;
}

poly.fix_exponent = function(v) {
  v = v.toExponential(16);
  exp = v.replace(/.*e[+-](\d+)$/,"$1");
  while(exp.length < 3) {
    exp = '0' + exp;
  }
  v = v.replace(/(.*e[+-])(\d+)$/,"$1" + exp);
  return v;
}

poly.parse_results = function() {
  var indent = [26,37,45,50];
  var iv = indent[poly.output_form];
  var result = "";
  var len = poly.poly_terms.length;
  //ben ekledim
  var rafet=0;
  
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
  
  result += "\nCopyright (c) 2013, P. Lutus -- http://arachnoid.com. All Rights Reserved.\n";
  result += "\nCopyright (c) 2014, R. IRMAK -- Blood lactate threshold adaptation\n";
  // ben ekledim
  result +="\nLactate="+rafet;    
  return result;
}

poly.right_align = function(s,n) {
  while(s.length < n) {
    s = " " + s;
  }
  return s
}

poly.create_table_row = function(x,start,end,decimals,exp) {
  var y = matf.regress(x,poly.poly_terms);
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
  var exp = poly.id("table_exponent").checked
  var start = poly.float_id("table_start");
  var end = poly.float_id("table_end");
  var step = poly.float_id("table_step");
  var decimals = poly.float_id("table_decimals");
  var result = "x,y,%\n";
  row = "";
  for(var x = start; x <= end;x += step) {
    row = poly.create_table_row(x,start,end,decimals,exp);
    result += row;
  }
  lastrow = poly.create_table_row(end,start,end,decimals,exp);
  if(lastrow != row) {
    result += lastrow;
  }
  poly.id("table_results_area").value = result;
}

poly.generate_graphic = function() {
  var dataURL = poly.canvas.toDataURL("image/png");
  window.open(dataURL, "Polynomial Regression Grafiği");
};

/*poly.rafet =function(){
sonuc=0;
for(i = 0;i < poly.poly_terms.length;i++) {
	sonuc+= parseFloat(poly.poly_terms[i])*4^i;
	}
	
	return poly.poly_terms.length;
}*/

addEvent(window,'load',poly.init);

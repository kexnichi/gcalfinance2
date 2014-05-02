window.c = {
    /**
     * client id
     * @type {string}
     */
    CRIENT_ID : "770340556488-uolpk7sncag836kea775sophniocb4s2.apps.googleusercontent.com",
    /**
     * api key
     * @type {string}
     */
    API_KEY : "AIzaSyCwS-azZSTS2DbJpKTRqcFC5LMTZ3Nu3Z4",
    /**
     * scope
     * @type {Array.<string>}
     */
    SCOPES : ["https://www.googleapis.com/auth/plus.me", "https://www.googleapis.com/auth/calendar.readonly"],
    /**
     * logout uri
     * @type {string}
     */
    LOGOUT_URI : "https://www.google.com/accounts/Logout",
    /**
     * Google Calendarを表示するURL
     * @type {string}
     */
    GOOGLE_CALENDAR_URI : "//www.google.com/calendar/embed?showTabs=0&showPrint=0&showTitle=0&showTz=0&wkst=2&bgcolor=%23FFFFFF"
};

window.g = {
    windowWidth : $(window).width(),
    windowHeight : $(window).height(),
    calendarLoaded : false,
    categories : [],
    events : {},
    chartData : {},
    monthlySlider : null
};

window.f = {
    /**
     * Google Client Api ロード時のコールバック
     */
    onClientLoad : function() {
        // ログインチェック
        gapi.client.setApiKey(c.API_KEY);
        window.setTimeout(function() {
            gapi.auth.authorize({
                client_id : c.CRIENT_ID,
                scope : c.SCOPES,
                immediate : true
            }, f.onAuthorize);
        }, 1);
    },

    /**
     * ログイン確認のコールバック
     * @param {Object} authResult
     */
    onAuthorize : function(authResult) {
        if (authResult && !authResult.error) {
            // ログイン成功時
            // アカウント情報のロード
            f.loadAcountInfo();
            // カレンダー情報のロード
            f.loadCalendar();
        } else {
            // ログイン失敗時
            f.login();
        }
    },

    /**
     * アカウント情報の取得
     */
    loadAcountInfo : function() {

        var userId = "me";
        gapi.client.request({
            path : "/plus/v1/people/" + userId,
            method : "GET"
        }).execute(f.onLoadAcountInfo);

        /*
         gapi.client.load("plus", "v1", function() {
         gapi.client.plus.people.get({
         "userId" : "me"
         }).execute(f.onLoadAcountInfo);
         });
         */
    },

    /**
     * アカウント情報ロード時のコールバック
     * @param {Object} resp
     */
    onLoadAcountInfo : function(resp) {
        var profile = $("#profile");
        profile.empty();
        var a = $("<a>").attr({
            href : resp.url,
            target : "_blank"
        });
        var img = $("<img>").attr({
            src : resp.image.url,
            style : "width:42px;height:42px;diplay:inline;"
        });
        a.append(img);
        a.append("<span>" + resp.displayName + "</span>");
        profile.append(a);
    },

    /**
     * カレンダーの取得
     */
    loadCalendar : function() {
        gapi.client.request({
            path : "/calendar/v3/users/me/calendarList",
            method : "GET",
            params : {
                fields : "items(colorId,description,id,location,summary)"
            }
        }).execute(f.onLoadCalendar);

        /*
         gapi.client.load("calendar", "v3", function(){
         gapi.client.calendar.calendarList.list().execute();
         });
         */
    },

    /**
     * カレンダー情報ロード時のコールバック
     * @param {Object} jsonResp
     * @param {string} rawResp
     */
    onLoadCalendar : function(jsonResp, rawResp) {
        console.log("onLoadCalendar-in");
        $.each(jsonResp.items, function(i, calendarList) {
            if (calendarList.summary.indexOf("$") !== 0) {
                // continue
                return true;
            }
            // 取得した情報を格納
            g.categories.push({
                id : calendarList.id,
                name : calendarList.summary,
                budget : calendarList.location,
                colorId : calendarList.colorId,
                description : calendarList.description,
            });
        });

        // イベント情報の取得
        var date = new Date();
        f.loadEventByMonth(date.getFullYear(), date.getMonth() + 1);
        f.loadEventByMonth(date.getFullYear(), date.getMonth());
        f.loadEventByMonth(date.getFullYear(), date.getMonth() - 1);

        g.monthlySlider = null;
        g.monthlySlider = new Swipe($("#monthly_slider").get(0), {
            startSlide : 2,
            callback : function(e, index, child) {
                console.log("index:" + index);
                if (index === 0) {
                    var yyyyMM = child.children[0].id.slice(-7);
                    var date = new Date(yyyyMM.slice(0, 4), yyyyMM.slice(-2), 1);
                    f.loadEventByMonth(date.getFullYear(), date.getMonth() - 1);
                }
            }
        });
        var monthlySlider = g.monthlySlider;
        $("#header_button_prev").removeClass("hidden").click(function() {
            monthlySlider.prev();
            return false;
        });
        $("#header_button_next").removeClass("hidden").click(function() {
            monthlySlider.next();
            return false;
        });

        f.openMonthly();

        // カレンダーを読み込む
        f.loadGoogleCalendar();
    },

    /**
     * イベント情報の取得(月別)
     * @param {number} year
     * @param {number} month
     */
    loadEventByMonth : function(year, month) {
        console.log("loadEventByMonth-in");
        var date = new Date();
        date.setFullYear(year);
        date.setMonth(month - 1);
        var min = date.getFullYear() + "-" + (("_00" + (date.getMonth() + 1)).slice(-2)) + "-01T00:00:00+0900";
        date.setMonth(date.getMonth() + 1);
        var max = date.getFullYear() + "-" + (("_00" + (date.getMonth() + 1)).slice(-2)) + "-01T00:00:00+0900";

        $.each(g.categories, function(i, category) {
            var callback = f.onLoadEventByMonth;
            if (i === g.categories.length - 1) {
                callback = f.onLoadEventByMonthForLast;
            }
            f.loadEvent(category.id, category.name, callback, min, max);
        });
    },

    /**
     * イベントデータの取得
     * @param {string} calendarId
     * @param {string} categoryName
     * @param {function} callback
     * @param {string} timeMin yyyy-MM-ddThh:m:ss+nnnn(RFC 3339)
     * @param {string} timeMax yyyy-MM-ddThh:m:ss+nnnn(RFC 3339)
     */
    loadEvent : function(calendarId, categoryName, callback, timeMin, timeMax) {
        var params = {
            orderBy : "starttime",
            singleEvents : true,
            fields : "items(description,end,id,start,summary)"
        };
        if (timeMin && timeMax) {
            params.timeMin = timeMin;
            params.timeMax = timeMax;
        }
        gapi.client.request({
            path : "/calendar/v3/calendars/" + calendarId + "/events",
            method : "GET",
            params : params
        }).execute(function(jsonResp, rawResp) {
            callback(jsonResp, rawResp, {
                categoryName : categoryName,
                timeMin : timeMin
            });
        });
        /*
         gapi.client.load("calendar", "v3", function(){
         gapi.client.calendar.events.list({
         calendarId : ""
         }).execute();
         });
         */
    },

    /**
     * イベント情報ロード時のコールバック
     * @param {Object} jsonResp
     * @param {string} rawResp
     * @param {string} categoryName
     */
    onLoadEventByMonth : function(jsonResp, rawResp, param) {
        console.log("onLoadEventByMonth-in");
        var yearMonth = param.timeMin.slice(0, 7);
        if (g.events[yearMonth] === undefined) {
            g.events[yearMonth] = [];
        }
        // 取得したイベント情報を格納
        $.each(jsonResp.items, function(i, eventItem) {
            g.events[yearMonth].push([eventItem.start.date, param.categoryName, eventItem.summary, eventItem.description]);
        });
    },

    /**
     * イベント情報ロード時のコールバック(最後)
     * @param {Object} jsonResp
     * @param {string} rawResp
     * @param {string} categoryName
     */
    onLoadEventByMonthForLast : function(jsonResp, rawResp, param) {
        console.log("onLoadEventByMonthForLast-in");
        f.onLoadEventByMonth(jsonResp, rawResp, param);
        var yearMonth = param.timeMin.slice(0, 7);
        f.generateChartData(yearMonth);

        var wrapper = $("#monthly_slider_wrapper");
        wrapper.prepend($("<div>").css({
            display : "block"
        }).append($("<div>").attr({
            id : "monthly_wrapper_" + yearMonth
        })));
        // 円グラフの描画
        $("#monthly_wrapper_" + yearMonth).append($("<div>").attr({
            id : "monthly_pie" + yearMonth
        }));
        f.drawPiaChart($("#monthly_pie" + yearMonth).get(0), g.chartData[yearMonth].pie);
        // データテーブルの描画
        $("#monthly_wrapper_" + yearMonth).append($("<div>").attr({
            id : "monthly_table" + yearMonth
        }));
        f.drawDataTable($("#monthly_table" + yearMonth).get(0), g.events[yearMonth]);
        g.monthlySlider.setup();
    },

    /**
     * 各種グラフ用のデータ生成
     * @param {string} yearMonth
     */
    generateChartData : function(yearMonth) {
        console.log("generateChartData-in");
        var tmp = {};
        $.each(g.events[yearMonth], function(i, item) {
            var categoryName = item[1];
            var money = item[2];
            if (tmp[categoryName] === undefined) {
                tmp[categoryName] = money * 1;
            } else {
                tmp[categoryName] += money * 1;
            }
        });

        if (!g.chartData[yearMonth]) {
            g.chartData[yearMonth] = {};
        }
        g.chartData[yearMonth].pie = [["category", "money"]];
        for (var key in tmp) {
            g.chartData[yearMonth].pie.push([key, tmp[key]]);
        }
    },

    /**
     * 円グラフを描画する
     * @param {Object} drawArea
     * @param {Array} data
     */
    drawPiaChart : function(drawArea, data) {
        google.load("visualization", "1", {
            packages : ["corechart"],
            // language : "",
            callback : function() {
                var dataTable = new google.visualization.arrayToDataTable(data);
                var option = {
                    pieHole : 0.4
                };
                var chart = new google.visualization.PieChart(drawArea);
                chart.draw(dataTable, option);
            }
        });
    },

    /**
     * データテーブルを描画する
     * @param {Object} drawArea
     * @param {Array} data
     */
    drawDataTable : function(drawArea, data) {
        google.load("visualization", "1", {
            packages : ["table"],
            // language : "",
            callback : function() {
                var dataTable = new google.visualization.DataTable();
                dataTable.addColumn("string", "date");
                dataTable.addColumn("string", "category");
                dataTable.addColumn("string", "money");
                dataTable.addColumn("string", "description");
                dataTable.addRows(data);
                var chart = new google.visualization.Table(drawArea);
                var option = {
                    sortColumn : 0
                };
                chart.draw(dataTable, option);
            }
        });
    },

    /**
     * カレンダーを読み込む
     */
    loadGoogleCalendar : function() {
        var i, l, id;
        var uri = c.GOOGLE_CALENDAR_URI;
        for ( i = 0, l = g.categories.length; i < l; i++) {
            id = g.categories[i].id;
            uri += "&src=" + window.encodeURIComponent(id);
        }
        $("#calendar_wrapper").css({
            height : (g.windowHeight - 65) + "px",
            width : g.windowWidth + "px",
            "over-flow" : "auto"
        });
        var calendarFrame = $("#calendar_frame");
        calendarFrame.on("load", function() {
            g.calendarLoaded = true;
        });
        calendarFrame.attr({
            src : uri,
            height : (g.windowHeight - 65) + "px",
            width : g.windowWidth + "px"
        });
    },

    /**
     * カレンダー画面を表示する
     */
    openGoogleCalendar : function() {
        if (g.calendarLoaded) {
            $("#calendar").removeClass("hidden");
            $("#loading").addClass("hidden");
            $("#monthly").addClass("hidden");
        } else {
            window.alert("now loading");
        }
    },

    /**
     * 月毎画面を表示する
     */
    openMonthly : function() {
        $("#monthly").removeClass("hidden");
        $("#loading").addClass("hidden");
        $("#calendar").addClass("hidden");
    },
    /**
     * ログイン
     */
    login : function() {
        gapi.auth.authorize({
            client_id : c.CRIENT_ID,
            scope : c.SCOPES,
            immediate : false
        }, f.onAuthorize);
    },

    /**
     * ログアウト
     */
    logout : function() {
        var logoutFrame = $("#logout_frame");
        logoutFrame.on("load", function() {
            window.location.href = window.location.href;
        });
        logoutFrame.attr({
            src : c.LOGOUT_URI
        });
    }
};

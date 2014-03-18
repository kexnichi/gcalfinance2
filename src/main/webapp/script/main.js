// Load Library
google.load("jquery", "1");
google.load("visualization", "1", {
    "packages" : ["table", "corechart"]
});

// constants
window.constants = {
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

window.data = {
    categories : []
};

// Functions
window.f = {

    /**
     * Google Client Api ロード時のコールバック
     */
    onClientLoad : function() {
        // ログインチェック
        gapi.auth.authorize({
            client_id : constants.CRIENT_ID,
            scope : constants.SCOPES,
            immediate : true
        }, f.onAuthorize);

        // カバーのサイズ変更
        var cover = $("#cover");
        cover.css({
            position : "absolute",
            left : 0,
            top : 0,
            width : $(window).width(),
            height : $(window).height(),
            "background-color" : "#000000",
            "filter" : "alpha(opacity=30)",
            "-moz-opacity" : "0.30",
            "-khtml-opacity" : "0.30",
            "opacity" : "0.30"
        });

        //gapi.client.setApiKey(constants.API_KEY);
        // window.setTimeout(f.checkAuth, 1);

    },

    /**
     * ログイン確認のコールバック
     * @param {Object} authResult
     */
    onAuthorize : function(authResult) {
        var authorizeButton = $("#authorize_button");
        var logoutButton = $("#logout_button");

        if (authResult && !authResult.error) {
            // ログイン成功時
            logoutButton.click(f.logout);
            //f.displayInline(logoutButton);
            f.displayNone(authorizeButton);
            // 認証後のメイン処理
            f.main();
        } else {
            // ログイン失敗時
            authorizeButton.click(f.login);
            f.displayInline(authorizeButton);
            //f.displayNone(logoutButton);
        }
    },

    /**
     * メイン処理
     */
    main : function() {
        // アカウント情報の取得
        f.getAcountInfo();

        // カレンダーリストの取得
        f.displayBlock("#calendar_loading");
        gapi.client.request({
            path : "/calendar/v3/users/me/calendarList",
            method : "GET"
        }).execute(function(jsonResp, rawResp) {
            var items = jsonResp.items;
            var i, l, calendarList, calendar;
            var src = "";
            for ( i = 0, l = items.length; i < l; i++) {
                calendarList = items[i];
                console.log(calendarList.summary);
                if (calendarList.summary.indexOf("$") !== 0) {
                    continue;
                }
                data.categories.push({
                    id : calendarList.id,
                    name : calendarList.summary,
                    budget : calendarList.location,
                    colorId : calendarList.colorId
                });
                src += "&src=" + window.encodeURIComponent(calendarList.id);
            }

            $("#calendar_frame").attr({
                src : constants.GOOGLE_CALENDAR_URI + src,
                height : $(window).height() - 102
            });
            f.displayNone("#calendar_loading");
            f.displayBlock("#calendar");
        });

    },

    /**
     * アカウント情報の取得と表示
     */
    getAcountInfo : function() {
        gapi.client.load("plus", "v1", function() {
            var request = gapi.client.plus.people.get({
                "userId" : "me"
            });
            request.execute(function(resp) {
                var a = $("<a>").attr({
                    href : resp.url,
                    target : "_blank"
                });
                var img = $("<img>").attr({
                    src : resp.image.url,
                    style : "width:32px;height:32px;diplay:inline;"
                });
                a.append("<h6 style='display:inline'>" + resp.displayName + "</h6>");
                a.append(img);
                $("#header_right").append(a);
            });
        });
    },

    // checkAuth : function() {
    // gapi.auth.authorize({
    // client_id : constants.CRIENT_ID,
    // scope : constants.SCOPES,
    // immediate : true
    // }, f.handleAuthResult);
    // },

    // handleAuthResult : function(authResult) {
    // var authorizeButton = document.getElementById("authorize_button");
    // var logoutButton = $("#authrize_logout");
    // if (authResult && !authResult.error) {
    // authorizeButton.style.visibility = "hidden";
    // logoutButton.click(f.logout);
    // logoutButton.css({
    // "visibility" : ""
    // });
    // f.makeApiCall();
    // } else {
    // authorizeButton.onclick = f.handleAuthClick;
    // authorizeButton.style.visibility = "";
    // logoutButton.css({
    // "visibility" : "hidden"
    // });
    // }
    // },

    // handleAuthClick : function(event) {
    // gapi.auth.authorize({
    // client_id : constants.CRIENT_ID,
    // scope : constants.SCOPES,
    // immediate : false
    // }, f.handleAuthResult);
    // return false;
    // },
    makeApiCall : function() {

        // gapi.client.load("plus", "v1", function() {
        // var request = gapi.client.plus.people.get({
        // "userId" : "me"
        // });
        // request.execute(function(resp) {
        // var heading = document.createElement("h4");
        // var image = document.createElement("img");
        // image.src = resp.image.url;
        // heading.appendChild(image);
        // heading.appendChild(document.createTextNode(resp.displayName));
        //
        // document.getElementById("content").appendChild(heading);
        // });
        // });

        var restRequest = gapi.client.request({
            "path" : "/calendar/v3/users/me/calendarList"

        });
        restRequest.execute(function(calendarList) {
            // カレンダーを選択できるようにコンボボックスを作成する。
            var sel = document.createElement("select");
            var clItem = calendarList.items;
            var op = document.createElement("option");
            op.appendChild(document.createTextNode("---"));
            op.setAttribute("value", "");
            sel.appendChild(op);
            for (var i = 0; i < clItem.length; i++) {
                op = document.createElement("option");
                op.appendChild(document.createTextNode(clItem[i].summary));

                op.setAttribute("value", clItem[i].id);
                sel.appendChild(op);

            }
            sel.addEventListener("change", f.mySelCal, false);
            document.getElementById("content").appendChild(sel);
        });
    },

    getEventList : function(calenderId) {
        // 現在日付を基準に取得範囲を決める
        var today = new Date();
        var endDay = new Date(today.getTime() + 60 * 86400000);
        var restRequest = gapi.client.request({
            "path" : "/calendar/v3/calendars/" + calenderId + "/events",
            "params" : {
                "orderBy" : "startTime",
                "singleEvents" : true,
                "timeMax" : endDay,
                "timeMin" : today
            }
        });
        console.log("https://www.googleapis.com/calendar/v3/calendars/" + encodeURIComponent(calenderId) + "/events");
        restRequest.execute(function(evList) {
            //console.dir(evList);
            var evItem = evList.items;
            var ul = document.createElement("ul");
            for (var i = 0; i < evItem.length; i++) {
                var li = document.createElement("li");
                var startDate = evItem[i].start.date;
                if (!startDate) {
                    startDate = evItem[i].start.dateTime;
                }
                li.appendChild(document.createTextNode(startDate + " " + evItem[i].summary));
                ul.appendChild(li);

            }
            document.getElementById("content").appendChild(ul);
        });
    },

    mySelCal : function(e) {
        if (this.selectedIndex == 0) {
            return;
        }
        // 選択されたカレンダーの直近の予定を表示する
        f.getEventList(this.options[this.selectedIndex].value);
    },

    login : function(event) {
        gapi.auth.authorize({
            client_id : constants.CRIENT_ID,
            scope : constants.SCOPES,
            immediate : false
        }, f.onAuthorize);
        return false;
    },

    logout : function() {
        window.alert("3秒後にリロードします");
        window.setTimeout(function() {
            window.location.href = window.location.href;
        }, 3000);
        $("#logout_frame").attr({
            src : constants.LOGOUT_URI
        });
    },
    /**
     * 対象の要素にdisplay:blockをつける
     * @param {Object|string} element jQueryの要素オブジェクトまたはセレクタ文字列
     */
    displayBlock : function(element) {
        if ( typeof element === "string") {
            element = $(element);
        }
        element.css({
            display : "block"
        });
    },
    /**
     * 対象の要素にdisplay:noneをつける
     * @param {Object|string} element jQueryの要素オブジェクトまたはセレクタ文字列
     */
    displayNone : function(element) {
        if ( typeof element === "string") {
            element = $(element);
        }
        element.css({
            display : "none"
        });
    },
    /**
     * 対象の要素にdisplay:inlineをつける
     * @param {Object|string} element jQueryの要素オブジェクトまたはセレクタ文字列
     */
    displayInline : function(element) {
        if ( typeof element === "string") {
            element = $(element);
        }
        element.css({
            display : "inline"
        });
    }
};


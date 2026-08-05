:root{
    --bg:#0b1020;
    --panel:#11182b;
    --panel2:#172038;
    --text:#f5f7ff;
    --muted:#9da8c0;
    --border:rgba(255,255,255,.10);
    --accent:#19c37d;
    --accent2:#00bfff;
    --danger:#ff5571;
    --input:#0e1526;
    --shadow:0 20px 60px rgba(0,0,0,.25);
}

body.light{
    --bg:#f4f7fb;
    --panel:#ffffff;
    --panel2:#f0f4fa;
    --text:#172033;
    --muted:#667085;
    --border:rgba(20,30,50,.12);
    --input:#f8fafc;
    --shadow:0 15px 40px rgba(20,30,50,.10);
}

*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:Inter,Arial,Helvetica,sans-serif;
}

body{
    min-height:100vh;
    background:
        radial-gradient(circle at 10% 10%, rgba(25,195,125,.12), transparent 30%),
        radial-gradient(circle at 90% 20%, rgba(0,191,255,.10), transparent 30%),
        var(--bg);
    color:var(--text);
    transition:.25s;
}

a{
    text-decoration:none;
    color:inherit;
}

button,input,textarea{
    font:inherit;
}

button{
    cursor:pointer;
}

.app-shell{
    min-height:100vh;
}

.topbar{
    height:78px;
    padding:0 5%;
    display:flex;
    justify-content:space-between;
    align-items:center;
    border-bottom:1px solid var(--border);
    background:rgba(10,15,30,.55);
    backdrop-filter:blur(18px);
    position:sticky;
    top:0;
    z-index:20;
}

body.light .topbar{
    background:rgba(255,255,255,.75);
}

.brand{
    display:flex;
    align-items:center;
    gap:12px;
}

.brand-icon{
    width:44px;
    height:44px;
    display:grid;
    place-items:center;
    border-radius:13px;
    background:linear-gradient(135deg,var(--accent),var(--accent2));
    font-size:22px;
}

.brand h1{
    font-size:20px;
}

.brand span{
    font-size:12px;
    color:var(--muted);
}

.top-actions{
    display:flex;
    gap:8px;
    align-items:center;
}

.icon-btn,
.nav-btn,
.secondary-btn,
.primary-btn,
.danger-btn,
.small-btn{
    border:1px solid var(--border);
    border-radius:10px;
    padding:10px 14px;
    background:var(--panel);
    color:var(--text);
    transition:.2s;
}

.icon-btn:hover,
.nav-btn:hover,
.secondary-btn:hover,
.small-btn:hover{
    transform:translateY(-1px);
    border-color:rgba(25,195,125,.45);
}

.nav-btn.danger,
.danger-btn{
    background:rgba(255,85,113,.10);
    color:#ff7d91;
}

.main-content{
    width:min(1100px,92%);
    margin:35px auto;
}

.welcome-card{
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:20px;
    padding:28px;
    border:1px solid var(--border);
    border-radius:22px;
    background:linear-gradient(135deg,rgba(25,195,125,.10),rgba(0,191,255,.06));
    box-shadow:var(--shadow);
    margin-bottom:22px;
}

.eyebrow{
    color:var(--accent);
    font-size:11px;
    font-weight:800;
    letter-spacing:1.5px;
    margin-bottom:8px;
}

.welcome-card h2,
.history-toolbar h2{
    font-size:28px;
    margin-bottom:8px;
}

.welcome-card p{
    color:var(--muted);
    line-height:1.6;
}

.chat-panel{
    border:1px solid var(--border);
    border-radius:22px;
    background:rgba(255,255,255,.025);
    overflow:hidden;
    box-shadow:var(--shadow);
}

.chat-messages{
    min-height:430px;
    padding:25px;
}

.empty-state{
    min-height:380px;
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    text-align:center;
    color:var(--muted);
}

.empty-icon{
    width:68px;
    height:68px;
    display:grid;
    place-items:center;
    border-radius:20px;
    background:var(--panel2);
    font-size:30px;
    margin-bottom:16px;
}

.empty-state h3,
.empty-history h3{
    color:var(--text);
    font-size:23px;
    margin-bottom:8px;
}

.suggestions{
    display:flex;
    gap:8px;
    flex-wrap:wrap;
    justify-content:center;
    margin-top:20px;
}

.suggestions button{
    border:1px solid var(--border);
    background:var(--panel);
    color:var(--text);
    border-radius:10px;
    padding:9px 12px;
}

.message{
    max-width:88%;
    padding:16px 18px;
    border-radius:18px;
    margin-bottom:15px;
    line-height:1.65;
    white-space:pre-wrap;
}

.message.user{
    margin-left:auto;
    background:linear-gradient(135deg,#19a96f,#168a60);
    color:white;
    border-bottom-right-radius:5px;
}

.message.ai{
    margin-right:auto;
    background:var(--panel2);
    border:1px solid var(--border);
    border-bottom-left-radius:5px;
}

.message-label{
    display:block;
    font-size:11px;
    font-weight:800;
    opacity:.75;
    margin-bottom:5px;
}

.composer-wrap{
    padding:18px 20px 15px;
    border-top:1px solid var(--border);
    background:rgba(0,0,0,.08);
}

.composer{
    display:flex;
    gap:10px;
}

.composer textarea{
    flex:1;
    resize:none;
    min-height:52px;
    max-height:150px;
    border:1px solid var(--border);
    outline:none;
    border-radius:14px;
    padding:15px;
    background:var(--input);
    color:var(--text);
}

.composer textarea:focus{
    border-color:rgba(25,195,125,.6);
    box-shadow:0 0 0 3px rgba(25,195,125,.08);
}

.send-btn,
.primary-btn{
    border:none;
    background:linear-gradient(135deg,var(--accent),#10a968);
    color:white;
    font-weight:700;
}

.send-btn{
    min-width:105px;
    border-radius:14px;
}

.send-btn:disabled{
    opacity:.6;
    cursor:not-allowed;
}

.composer-footer{
    display:flex;
    justify-content:space-between;
    color:var(--muted);
    font-size:11px;
    margin-top:8px;
}

.spinner{
    display:inline-block;
    width:15px;
    height:15px;
    border:2px solid rgba(255,255,255,.4);
    border-top-color:white;
    border-radius:50%;
    animation:spin .7s linear infinite;
}

.hidden{
    display:none;
}

@keyframes spin{
    to{transform:rotate(360deg)}
}

/* HISTORY */

.history-toolbar{
    display:flex;
    justify-content:space-between;
    align-items:end;
    gap:20px;
    margin-bottom:20px;
}

.history-actions{
    display:flex;
    gap:8px;
    align-items:center;
    flex-wrap:wrap;
}

.history-actions input{
    width:220px;
    padding:11px 13px;
    border-radius:10px;
    border:1px solid var(--border);
    background:var(--input);
    color:var(--text);
    outline:none;
}

.history-list{
    display:flex;
    flex-direction:column;
    gap:15px;
}

.history-card{
    background:var(--panel);
    border:1px solid var(--border);
    border-radius:18px;
    padding:20px;
    box-shadow:var(--shadow);
}

.history-meta{
    display:flex;
    justify-content:space-between;
    gap:15px;
    color:var(--muted);
    font-size:12px;
    margin-bottom:13px;
}

.history-question{
    font-size:18px;
    margin-bottom:12px;
}

.history-answer{
    color:var(--muted);
    line-height:1.7;
    white-space:pre-wrap;
    max-height:250px;
    overflow:auto;
}

.history-footer{
    display:flex;
    justify-content:space-between;
    align-items:center;
    margin-top:18px;
}

.small-btn{
    padding:8px 11px;
}

.delete-btn{
    border:1px solid rgba(255,85,113,.3);
    background:rgba(255,85,113,.08);
    color:#ff7d91;
    padding:8px 12px;
    border-radius:9px;
}

.empty-history{
    text-align:center;
    padding:80px 20px;
    background:var(--panel);
    border:1px solid var(--border);
    border-radius:20px;
}

/* AUTH */

.auth-body{
    display:grid;
    place-items:center;
    padding:25px;
}

.auth-card{
    width:min(430px,100%);
    padding:35px;
    border:1px solid var(--border);
    border-radius:24px;
    background:var(--panel);
    box-shadow:var(--shadow);
}

.auth-logo{
    width:60px;
    height:60px;
    display:grid;
    place-items:center;
    border-radius:18px;
    background:linear-gradient(135deg,var(--accent),var(--accent2));
    font-size:28px;
    margin-bottom:18px;
}

.auth-card h1{
    font-size:30px;
    margin-bottom:7px;
}

.auth-subtitle{
    color:var(--muted);
    margin-bottom:25px;
}

.auth-form{
    display:flex;
    flex-direction:column;
    gap:8px;
}

.auth-form label{
    font-size:13px;
    font-weight:700;
    margin-top:8px;
}

.auth-form input{
    width:100%;
    padding:13px;
    border-radius:11px;
    border:1px solid var(--border);
    background:var(--input);
    color:var(--text);
    outline:none;
}

.auth-form input:focus{
    border-color:var(--accent);
}

.full{
    width:100%;
    padding:13px;
    margin-top:12px;
}

.auth-link{
    text-align:center;
    margin-top:20px;
    color:var(--muted);
    font-size:14px;
}

.auth-link a{
    color:var(--accent);
    font-weight:700;
}

.error-box{
    padding:12px;
    border-radius:10px;
    background:rgba(255,85,113,.10);
    color:#ff8798;
    border:1px solid rgba(255,85,113,.25);
    margin-bottom:15px;
}

@media(max-width:760px){
    .topbar{
        height:auto;
        padding:14px 4%;
        gap:12px;
        align-items:flex-start;
    }

    .top-actions{
        flex-wrap:wrap;
        justify-content:flex-end;
    }

    .welcome-card,
    .history-toolbar{
        flex-direction:column;
        align-items:flex-start;
    }

    .history-actions{
        width:100%;
    }

    .history-actions input{
        width:100%;
    }

    .composer{
        flex-direction:column;
    }

    .send-btn{
        min-height:48px;
    }

    .composer-footer{
        flex-direction:column;
        gap:4px;
    }

    .message{
        max-width:96%;
    }
}

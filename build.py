#!/usr/bin/env python3
"""Bundles src/*.js into index.html (single file, uses vendor/three.min.js). Run: python build.py"""
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
S='src/'
files=['c_engine.js','d_game.js','h_models.js','h_models2.js','m_rig.js','f_fx.js','j_audio.js','i_view3d.js','l_env.js','e_ui.js','k_sim.js','n_menu.js','o_prof.js','p_admin.js']
js="\n".join(open(S+f,encoding='utf-8').read() for f in files)
head=open(S+'a_head.html',encoding='utf-8').read();body=open(S+'b_body.html',encoding='utf-8').read()
eng=open(S+'c_engine.js',encoding='utf-8').read().replace('</script','<\\/script')
open('index.html','w',encoding='utf-8').write(head+"\n"+body+"\n<script type=\"text/plain\" id=\"engSrc\">"+eng+"</script>\n<script src=\"vendor/three.min.js\"></script>\n<script>\n(()=>{\n'use strict';\n"+js+"\n})();\n</script>\n")
print('built index.html',len(js),'bytes of JS')

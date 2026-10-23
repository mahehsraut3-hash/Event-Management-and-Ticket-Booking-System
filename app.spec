# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller Specification for Nova 3D AI Companion
Bundles the application into a standalone Windows executable.
"""
import sys
import os

block_cipher = None

BASE_DIR = os.path.abspath(SPECPATH)

datas = [
    (os.path.join(BASE_DIR, 'frontend'), 'frontend'),
    (os.path.join(BASE_DIR, 'assets'), 'assets'),
    (os.path.join(BASE_DIR, 'config.py'), '.'),
]

hidden_imports = [
    'core',
    'core.ai_service',
    'core.tts_service',
    'core.chat_manager',
    'core.server',
    'core.bridge',
    'webview',
    'clr',
    'pythonnet',
    'requests',
    'gtts',
    'urllib3',
]

a = Analysis(
    ['main.py'],
    pathex=[BASE_DIR],
    binaries=[],
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'unittest'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='Nova3DCompanion',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=os.path.join(BASE_DIR, 'assets', 'icon.ico') if os.path.exists(os.path.join(BASE_DIR, 'assets', 'icon.ico')) else None
)

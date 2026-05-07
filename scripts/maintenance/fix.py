#!/usr/bin/env python3
"""
Operator AI Maintenance CLI
Consolida todos los fix_*.py en herramientas mantenibles.
"""
import argparse
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent.parent

def run_lint_fix():
    """Ejecuta ESLint + Prettier en todo src/"""
    print("🔧 Ejecutando lint + format...")
    subprocess.run(["pnpm", "lint"], cwd=REPO_ROOT, check=False)
    subprocess.run(["pnpm", "format"], cwd=REPO_ROOT, check=False)
    print("✅ Lint completado")

def run_typecheck():
    """Verifica TypeScript"""
    print("🔍 Verificando tipos...")
    result = subprocess.run(["pnpm", "typecheck"], cwd=REPO_ROOT)
    return result.returncode == 0

def clean_dead_features():
    """Lista features con pocos archivos para revisión"""
    features_dir = REPO_ROOT / "src" / "features"
    print("\n📊 Features con menos de 5 archivos (candidatas a limpieza):")
    for feat in sorted(features_dir.iterdir()):
        if feat.is_dir():
            count = len(list(feat.rglob("*")))
            if count < 5:
                print(f"  ⚠️  {feat.name}: {count} archivos")
    print()

def backup_before_changes():
    """Crea backup con timestamp"""
    backup_dir = REPO_ROOT / ".backup" / f"pre-cleanup-{__import__('datetime').datetime.now().strftime('%Y%m%d-%H%M%S')}"
    backup_dir.mkdir(parents=True, exist_ok=True)
    print(f"💾 Backup creado en: {backup_dir}")
    return backup_dir

def main():
    parser = argparse.ArgumentParser(description="Operator AI Maintenance")
    parser.add_argument("command", choices=["lint", "types", "audit-features", "backup", "all"])
    args = parser.parse_args()

    if args.command == "lint":
        run_lint_fix()
    elif args.command == "types":
        sys.exit(0 if run_typecheck() else 1)
    elif args.command == "audit-features":
        clean_dead_features()
    elif args.command == "backup":
        backup_before_changes()
    elif args.command == "all":
        backup_before_changes()
        run_lint_fix()
        run_typecheck()
        clean_dead_features()

if __name__ == "__main__":
    main()

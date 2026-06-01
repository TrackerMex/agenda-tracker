#!/usr/bin/env bash

# init.sh - Script de verificación de arquitectura harness subagentes
# Este script verifica que la estructura del proyecto esté correctamente configurada

set -e

echo "🔍 Verificando arquitectura harness subagentes..."
echo ""

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador de errores
ERRORS=0

# Función para verificar archivo
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 existe"
    else
        echo -e "${RED}✗${NC} $1 NO EXISTE"
        ((ERRORS++))
    fi
}

# Función para verificar directorio
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/ existe"
    else
        echo -e "${RED}✗${NC} $1/ NO EXISTE"
        ((ERRORS++))
    fi
}

# Verificar archivos raíz
echo "📄 Archivos de configuración raíz:"
check_file "AGENTS.md"
check_file "CHECKPOINTS.md"
check_file "feature_list.json"
check_file "README.md"
echo ""

# Verificar directorios principales
echo "📁 Estructura de directorios:"
check_dir "backend"
check_dir "frontend"
check_dir "docs"
check_dir "progress"
check_dir ".claude"
check_dir ".claude/agents"
echo ""

# Verificar documentación
echo "📚 Documentación:"
check_file "docs/ARCHITECTURE.md"
check_file "docs/CONVENTIONS.md"
check_file "docs/VERIFICATION.md"
echo ""

# Verificar definiciones de agentes
echo "🤖 Definiciones de agentes:"
check_file ".claude/agents/orchestrator.md"
check_file ".claude/agents/builder.md"
check_file ".claude/agents/reviewer.md"
echo ""

# Verificar archivos de progreso
echo "📊 Sistema de progreso:"
check_file "progress/current.md"
check_file "progress/history.md"
echo ""

# Verificar backend
echo "🔧 Backend:"
check_dir "backend/src"
check_file "backend/package.json"
check_file "backend/.env.example"
echo ""

# Verificar frontend
echo "🎨 Frontend:"
check_dir "frontend/agenda-frontend/src"
check_file "frontend/agenda-frontend/package.json"
echo ""

# Verificar feature_list.json es JSON válido
echo "🔍 Validando feature_list.json:"
if command -v node &> /dev/null; then
    if node -e "JSON.parse(require('fs').readFileSync('feature_list.json', 'utf8'))" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} feature_list.json es JSON válido"
    else
        echo -e "${RED}✗${NC} feature_list.json NO es JSON válido"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠${NC} Node.js no instalado, saltando validación JSON"
fi
echo ""

# Resultado final
echo "═══════════════════════════════════════════════════════════"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "La arquitectura harness subagentes está correctamente configurada."
    echo "Puedes comenzar a trabajar con los agentes."
    echo ""
    echo "Próximos pasos:"
    echo "1. Lee AGENTS.md para entender el flujo de trabajo"
    echo "2. Revisa feature_list.json para ver las features pendientes"
    echo "3. Consulta CHECKPOINTS.md para conocer los criterios de validación"
    echo ""
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) encontrado(s)${NC}"
    echo ""
    echo "Por favor, corrige los errores antes de continuar."
    echo "Ejecuta este script nuevamente después de corregir."
    echo ""
    exit 1
fi

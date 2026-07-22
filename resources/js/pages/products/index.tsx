import { Head } from '@inertiajs/react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Loader2,
    X,
    ChevronLeft,
    ChevronRight,
    FileSpreadsheet,
    FileText,
    FileCode,
    Filter,
    AlertCircle,
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

// Definición de Tipos
interface Category {
    id: number;
    name: string;
    description?: string;
}

interface Product {
    id: number;
    code: string;
    name: string;
    status: boolean;
    description: string;
    category_id: number;
    category?: Category;
    created_at: string;
}

export default function ProductsIndex() {
    // Estados principales
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [actionLoading, setActionLoading] = useState<boolean>(false);

    // Búsqueda y Filtros
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');

    // Paginación
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 5;

    // Estado de la Modal (Crear / Editar)
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Formulario de Producto
    const [formCode, setFormCode] = useState<string>('');
    const [formName, setFormName] = useState<string>('');
    const [formCategoryId, setFormCategoryId] = useState<string>('');
    const [formStatus, setFormStatus] = useState<boolean>(true);
    const [formDescription, setFormDescription] = useState<string>('');

    // Errores de Validación
    const [errors, setErrors] = useState<Record<string, string>>({});

    const fetchInitialData = async () => {
        setLoading(true);

        try {
            const [productsRes, categoriesRes] = await Promise.all([
                fetch('/api/products').then((res) => res.json()),
                fetch('/api/categories').then((res) => res.json()),
            ]);

            if (productsRes.success) {
                setProducts(productsRes.data);
            }

            if (categoriesRes.success) {
                setCategories(categoriesRes.data);
            }
        } catch (error) {
            console.error('Error cargando datos:', error);
            toast.error('No se pudieron cargar los datos del inventario.');
        } finally {
            setLoading(false);
        }
    };

    // Cargar datos al montar el componente
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchInitialData();
    }, []);

    // Validar Formulario localmente (caja blanca / caja negra)
    const validateForm = (): boolean => {
        const tempErrors: Record<string, string> = {};

        // Regla Código: Alfanumérico, Max 20 caracteres
        if (!formCode) {
            tempErrors.code = 'El código es obligatorio.';
        } else if (formCode.length > 20) {
            tempErrors.code = 'El código no puede superar los 20 caracteres.';
        } else if (!/^[a-zA-Z0-9]+$/.test(formCode)) {
            tempErrors.code =
                'El código solo puede contener letras y números (alfanumérico).';
        }

        // Regla Nombre: Max 150 caracteres
        if (!formName.trim()) {
            tempErrors.name = 'El nombre es obligatorio.';
        } else if (formName.length > 150) {
            tempErrors.name = 'El nombre no puede superar los 150 caracteres.';
        }

        // Regla Categoría: Requerido
        if (!formCategoryId) {
            tempErrors.category_id = 'Debes seleccionar una categoría.';
        }

        // Regla Descripción: Max 500 caracteres
        if (!formDescription.trim()) {
            tempErrors.description = 'La descripción es obligatoria.';
        } else if (formDescription.length > 500) {
            tempErrors.description =
                'La descripción no puede superar los 500 caracteres.';
        }

        setErrors(tempErrors);

        return Object.keys(tempErrors).length === 0;
    };

    // Abrir Modal para Crear
    const handleOpenCreateModal = () => {
        setEditingProduct(null);
        setFormCode('');
        setFormName('');
        setFormCategoryId('');
        setFormStatus(true);
        setFormDescription('');
        setErrors({});
        setIsModalOpen(true);
    };

    // Abrir Modal para Editar
    const handleOpenEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormCode(product.code);
        setFormName(product.name);
        setFormCategoryId(String(product.category_id));
        setFormStatus(product.status);
        setFormDescription(product.description);
        setErrors({});
        setIsModalOpen(true);
    };

    // Guardar Producto (Submit POST / PUT)
    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Corrige los errores del formulario.');

            return;
        }

        setActionLoading(true);
        const payload = {
            code: formCode,
            name: formName,
            category_id: Number(formCategoryId),
            status: formStatus,
            description: formDescription,
        };

        const url = editingProduct
            ? `/api/products/${editingProduct.id}`
            : '/api/products';
        const method = editingProduct ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content || '',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success(
                    editingProduct
                        ? 'Producto actualizado con éxito.'
                        : 'Producto creado con éxito.',
                );
                setIsModalOpen(false);
                fetchInitialData(); // Recargar listado completo
            } else {
                // Manejar errores de validación del backend Laravel
                if (data.errors) {
                    const backendErrors: Record<string, string> = {};
                    Object.keys(data.errors).forEach((key) => {
                        backendErrors[key] = data.errors[key][0];
                    });
                    setErrors(backendErrors);
                    toast.error(
                        'Error al guardar el producto. Revisa los campos.',
                    );
                } else {
                    toast.error(data.message || 'Ocurrió un error inesperado.');
                }
            }
        } catch (error) {
            console.error('Error al guardar:', error);
            toast.error('Error de red al guardar el producto.');
        } finally {
            setActionLoading(false);
        }
    };

    // Eliminar Producto (DELETE)
    const handleDeleteProduct = async (productId: number) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
return;
}

        setActionLoading(true);

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content || '',
                },
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success('Producto eliminado correctamente.');
                fetchInitialData();
            } else {
                toast.error(data.message || 'No se pudo eliminar el producto.');
            }
        } catch (error) {
            console.error('Error al eliminar:', error);
            toast.error('Error de red al eliminar el producto.');
        } finally {
            setActionLoading(false);
        }
    };

    // Filtrar Productos en memoria
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const matchesSearch =
                product.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                product.code.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory =
                selectedCategory === 'all' ||
                product.category_id === Number(selectedCategory);

            const matchesStatus =
                selectedStatus === 'all' ||
                (selectedStatus === 'active' && product.status) ||
                (selectedStatus === 'inactive' && !product.status);

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [products, searchQuery, selectedCategory, selectedStatus]);

    // Total de Páginas
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    // Ajustar página actual calculada en base a totalPages
    const clampedPage = useMemo(() => {
        return Math.min(currentPage, totalPages || 1);
    }, [currentPage, totalPages]);

    // Productos Paginados
    const paginatedProducts = useMemo(() => {
        const startIndex = (clampedPage - 1) * itemsPerPage;

        return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredProducts, clampedPage]);

    // Formatear Fecha
    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);

        return d.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // ==========================================
    // EXPORTACIONES DEL LADO DEL CLIENTE
    // ==========================================

    // Exportar a CSV
    const exportToCSV = () => {
        if (filteredProducts.length === 0) {
            toast.warning('No hay datos para exportar.');

            return;
        }

        const headers = [
            'Código',
            'Nombre',
            'Fecha Creación',
            'Estado',
            'Descripción',
            'Categoría',
        ];
        const rows = filteredProducts.map((p) => [
            p.code,
            p.name,
            formatDate(p.created_at),
            p.status ? 'Activo' : 'Inactivo',
            p.description.replace(/(\r\n|\n|\r)/gm, ' '),
            p.category?.name || 'N/A',
        ]);

        const csvContent =
            '\uFEFF' + // UTF-8 BOM para soporte de acentos en Excel
            [
                headers.join(','),
                ...rows.map((e) => e.map((val) => `"${val}"`).join(',')),
            ].join('\n');

        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute(
            'download',
            `inventario_productos_${new Date().toISOString().split('T')[0]}.csv`,
        );
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV exportado correctamente.');
    };

    // Exportar a Excel (Formato HTML-XLS compatible)
    const exportToExcel = () => {
        if (filteredProducts.length === 0) {
            toast.warning('No hay datos para exportar.');

            return;
        }

        let html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta charset="utf-8">
                <!--[if gte mso 9]>
                <xml>
                    <x:ExcelWorkbook>
                        <x:ExcelWorksheets>
                            <x:ExcelWorksheet>
                                <x:Name>Inventario de Productos</x:Name>
                                <x:WorksheetOptions>
                                    <x:DisplayGridlines/>
                                </x:WorksheetOptions>
                            </x:ExcelWorksheet>
                        </x:ExcelWorksheets>
                    </x:ExcelWorkbook>
                </xml>
                <![endif]-->
                <style>
                    table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
                    th { background-color: #4F46E5; color: white; padding: 10px; border: 1px solid #ddd; }
                    td { padding: 8px; border: 1px solid #ddd; text-align: left; }
                    tr:nth-child(even) { background-color: #f2f2f2; }
                    .header-title { font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: center; color: #1E1B4B; }
                </style>
            </head>
            <body>
                <div class="header-title">Reporte de Inventario de Productos - ${new Date().toLocaleDateString('es-ES')}</div>
                <table>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre del Producto</th>
                            <th>Fecha de Creación</th>
                            <th>Estado</th>
                            <th>Descripción</th>
                            <th>Categoría</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        filteredProducts.forEach((p) => {
            html += `
                <tr>
                    <td>${p.code}</td>
                    <td><b>${p.name}</b></td>
                    <td>${formatDate(p.created_at)}</td>
                    <td>${p.status ? 'Activo' : 'Inactivo'}</td>
                    <td>${p.description}</td>
                    <td>${p.category?.name || 'N/A'}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute(
            'download',
            `inventario_productos_${new Date().toISOString().split('T')[0]}.xls`,
        );
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Excel exportado correctamente.');
    };

    // Exportar a PDF (mediante ventana emergente formateada e impresión a PDF)
    const exportToPDF = () => {
        if (filteredProducts.length === 0) {
            toast.warning('No hay datos para exportar.');

            return;
        }

        const printWindow = window.open('', '_blank');

        if (!printWindow) {
            toast.error(
                'Habilita las ventanas emergentes para exportar a PDF.',
            );

            return;
        }

        let rowsHtml = '';
        filteredProducts.forEach((p) => {
            rowsHtml += `
                <tr>
                    <td class="code-cell">${p.code}</td>
                    <td><strong>${p.name}</strong></td>
                    <td>${formatDate(p.created_at)}</td>
                    <td>
                        <span class="badge ${p.status ? 'active' : 'inactive'}">
                            ${p.status ? 'Activo' : 'Inactivo'}
                        </span>
                    </td>
                    <td>${p.description}</td>
                    <td>${p.category?.name || 'N/A'}</td>
                </tr>
            `;
        });

        printWindow.document.write(`
            <html>
            <head>
                <title>Inventario de Productos - Reporte</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 20px; }
                    .header { margin-bottom: 30px; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; }
                    .header h1 { margin: 0; color: #1E1B4B; font-size: 24px; }
                    .header p { margin: 5px 0 0 0; color: #666; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background-color: #F3F4F6; color: #374151; font-weight: bold; border-bottom: 2px solid #E5E7EB; text-align: left; padding: 12px 10px; font-size: 13px; }
                    td { border-bottom: 1px solid #E5E7EB; padding: 12px 10px; font-size: 13px; vertical-align: top; }
                    tr:nth-child(even) td { background-color: #FAFAFA; }
                    .code-cell { font-family: monospace; font-weight: bold; color: #4B5563; }
                    .badge { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
                    .badge.active { background-color: #D1FAE5; color: #065F46; }
                    .badge.inactive { background-color: #F3F4F6; color: #374151; }
                    .summary { margin-top: 30px; font-size: 13px; color: #666; display: flex; justify-content: space-between; }
                    @media print {
                        body { padding: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Módulo de Gestión de Inventarios</h1>
                    <p>Reporte de existencias de productos - Generado el ${new Date().toLocaleString('es-ES')}</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Nombre del Producto</th>
                            <th>Fecha Creación</th>
                            <th>Estado</th>
                            <th>Descripción</th>
                            <th>Categoría</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
                <div class="summary">
                    <span>Total de ítems en este reporte: <strong>${filteredProducts.length}</strong></span>
                    <span>Sistema de Control de Inventarios</span>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
        toast.success('Documento PDF generado. Revisa el cuadro de impresión.');
    };

    return (
        <>
            <Head title="Inventario de Productos" />

            <div className="mx-auto flex h-full w-full max-w-7xl flex-1 flex-col gap-6 p-6">
                {/* Cabecera Principal */}
                <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-center dark:border-neutral-800">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
                            Inventario de Productos
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            Administra, filtra y exporta la información de tus
                            productos en stock.
                        </p>
                    </div>
                    <button
                        onClick={handleOpenCreateModal}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-[0_2px_4px_rgba(79,70,229,0.2)] transition-all hover:bg-indigo-700 hover:shadow-[0_4px_12px_rgba(79,70,229,0.3)] active:scale-[0.98] sm:w-auto"
                    >
                        <Plus className="size-4" />
                        <span>Nuevo Producto</span>
                    </button>
                </div>

                {/* Caja de Herramientas: Búsqueda, Filtros y Exportaciones */}
                <div className="flex flex-col items-stretch justify-between gap-4 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center dark:border-neutral-800 dark:bg-[#111110]">
                    {/* Búsqueda y Filtros */}
                    <div className="flex flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Buscar por código o nombre..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pr-4 pl-9 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100 dark:placeholder-neutral-500"
                            />
                        </div>

                        {/* Categoría Selector */}
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full appearance-none rounded-lg border border-neutral-200 bg-neutral-50 py-2 pr-8 pl-3 text-sm text-neutral-950 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:w-44 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100"
                            >
                                <option value="all">
                                    Todas las Categorías
                                </option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            <Filter className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-neutral-400" />
                        </div>

                        {/* Estado Selector */}
                        <div className="relative">
                            <select
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full appearance-none rounded-lg border border-neutral-200 bg-neutral-50 py-2 pr-8 pl-3 text-sm text-neutral-950 transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none sm:w-36 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-100"
                            >
                                <option value="all">Todos los Estados</option>
                                <option value="active">Activos</option>
                                <option value="inactive">Inactivos</option>
                            </select>
                            <Filter className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-neutral-400" />
                        </div>
                    </div>

                    {/* Menú de Exportación */}
                    <div className="flex justify-end gap-2 border-t border-neutral-100 pt-3 lg:border-t-0 lg:pt-0 dark:border-neutral-800">
                        <button
                            onClick={exportToCSV}
                            title="Exportar a CSV"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700 transition-all hover:scale-[1.02] hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        >
                            <FileCode className="size-3.5 text-blue-500" />
                            <span className="hidden sm:inline">CSV</span>
                        </button>
                        <button
                            onClick={exportToExcel}
                            title="Exportar a Excel"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700 transition-all hover:scale-[1.02] hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        >
                            <FileSpreadsheet className="size-3.5 text-green-500" />
                            <span className="hidden sm:inline">Excel</span>
                        </button>
                        <button
                            onClick={exportToPDF}
                            title="Exportar a PDF"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-semibold text-neutral-700 transition-all hover:scale-[1.02] hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        >
                            <FileText className="size-3.5 text-red-500" />
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                    </div>
                </div>

                {/* Tabla de Productos */}
                <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-[#111110]">
                    <div className="min-h-[300px] overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-neutral-200 bg-neutral-50 text-xs font-semibold tracking-wider text-neutral-500 uppercase dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
                                    <th className="px-6 py-4">Código</th>
                                    <th className="px-6 py-4">
                                        Nombre del Producto
                                    </th>
                                    <th className="px-6 py-4">Categoría</th>
                                    <th className="px-6 py-4">
                                        Fecha Creación
                                    </th>
                                    <th className="px-6 py-4">Estado</th>
                                    <th className="px-6 py-4">Descripción</th>
                                    <th className="px-6 py-4 text-right">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 text-sm text-neutral-800 dark:divide-neutral-800 dark:text-neutral-200">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-20 text-center"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Loader2 className="size-8 animate-spin text-indigo-600" />
                                                <span className="text-sm text-neutral-500">
                                                    Cargando inventario...
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-20 text-center text-neutral-500 dark:text-neutral-400"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <AlertCircle className="size-8 text-neutral-400" />
                                                <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                                                    Sin productos
                                                </p>
                                                <p className="max-w-xs text-xs">
                                                    No se encontraron productos
                                                    que coincidan con la
                                                    búsqueda o filtros
                                                    aplicados.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedProducts.map((product) => (
                                        <tr
                                            key={product.id}
                                            className="transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30"
                                        >
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-neutral-600 dark:text-neutral-400">
                                                {product.code}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-neutral-900 dark:text-neutral-100">
                                                {product.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="rounded bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                    {product.category?.name ||
                                                        'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-neutral-500 dark:text-neutral-400">
                                                {formatDate(product.created_at)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        product.status
                                                            ? 'border border-emerald-200/50 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                            : 'border border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400'
                                                    }`}
                                                >
                                                    <span
                                                        className={`size-1.5 rounded-full ${product.status ? 'bg-emerald-500' : 'bg-neutral-400'}`}
                                                    />
                                                    {product.status
                                                        ? 'Activo'
                                                        : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td
                                                className="max-w-xs truncate px-6 py-4 text-xs text-neutral-500 dark:text-neutral-400"
                                                title={product.description}
                                            >
                                                {product.description}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleOpenEditModal(
                                                                product,
                                                            )
                                                        }
                                                        title="Editar producto"
                                                        className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-indigo-600 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-indigo-400"
                                                    >
                                                        <Edit2 className="size-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteProduct(
                                                                product.id,
                                                            )
                                                        }
                                                        title="Eliminar producto"
                                                        className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-red-600 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-red-400"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Barra de Paginación */}
                    {!loading && filteredProducts.length > 0 && (
                        <div className="flex flex-col items-center justify-between gap-4 border-t border-neutral-200 bg-neutral-50/50 px-6 py-4 sm:flex-row dark:border-neutral-800 dark:bg-neutral-900/20">
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                Mostrando del{' '}
                                <b>{(clampedPage - 1) * itemsPerPage + 1}</b> al{' '}
                                <b>
                                    {Math.min(
                                        clampedPage * itemsPerPage,
                                        filteredProducts.length,
                                    )}
                                </b>{' '}
                                de <b>{filteredProducts.length}</b> productos.
                            </span>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(clampedPage - 1)}
                                    disabled={clampedPage === 1}
                                    className="rounded-lg border border-neutral-200 p-2 text-neutral-600 transition-colors hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                >
                                    <ChevronLeft className="size-4" />
                                </button>
                                <span className="flex items-center justify-center rounded-lg bg-neutral-100 px-4 py-1 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                    Pág. {clampedPage} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(clampedPage + 1)}
                                    disabled={clampedPage === totalPages}
                                    className="rounded-lg border border-neutral-200 p-2 text-neutral-600 transition-colors hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                >
                                    <ChevronRight className="size-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* MODAL DE REGISTRO / EDICIÓN */}
                {isModalOpen && (
                    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="animate-scale-up w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-[#161615]">
                            {/* Cabecera Modal */}
                            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
                                <h3 className="font-bold text-neutral-900 dark:text-neutral-50">
                                    {editingProduct
                                        ? 'Editar Producto'
                                        : 'Registrar Nuevo Producto'}
                                </h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-lg p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Formulario */}
                            <form onSubmit={handleSaveProduct}>
                                <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
                                    {/* Código (Max 20 alfanumérico) */}
                                    <div className="space-y-1">
                                        <label
                                            htmlFor="code"
                                            className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                                        >
                                            Código del Producto{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            id="code"
                                            type="text"
                                            value={formCode}
                                            onChange={(e) =>
                                                setFormCode(
                                                    e.target.value
                                                        .toUpperCase()
                                                        .trim(),
                                                )
                                            }
                                            maxLength={20}
                                            placeholder="Ejem: PROD001"
                                            disabled={!!editingProduct} // Desactivar si se edita, o permitir si se desea
                                            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm dark:bg-neutral-900 ${
                                                errors.code
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                                    : 'border-neutral-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-neutral-800'
                                            } text-neutral-950 placeholder-neutral-400 transition-all focus:ring-2 focus:outline-none dark:text-neutral-50`}
                                        />
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-neutral-400">
                                                Máx. 20 caracteres alfanuméricos
                                            </span>
                                            <span
                                                className={
                                                    formCode.length > 20
                                                        ? 'font-bold text-red-500'
                                                        : 'text-neutral-400'
                                                }
                                            >
                                                {formCode.length}/20
                                            </span>
                                        </div>
                                        {errors.code && (
                                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                                                <AlertCircle className="size-3" />
                                                {errors.code}
                                            </p>
                                        )}
                                    </div>

                                    {/* Nombre (Max 150) */}
                                    <div className="space-y-1">
                                        <label
                                            htmlFor="name"
                                            className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                                        >
                                            Nombre del Producto{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={formName}
                                            onChange={(e) =>
                                                setFormName(e.target.value)
                                            }
                                            maxLength={150}
                                            placeholder="Ejem: Laptop Gamer Lenovo i7"
                                            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm dark:bg-neutral-900 ${
                                                errors.name
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                                    : 'border-neutral-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-neutral-800'
                                            } text-neutral-950 placeholder-neutral-400 transition-all focus:ring-2 focus:outline-none dark:text-neutral-50`}
                                        />
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-neutral-400">
                                                Máx. 150 caracteres
                                            </span>
                                            <span
                                                className={
                                                    formName.length > 150
                                                        ? 'font-bold text-red-500'
                                                        : 'text-neutral-400'
                                                }
                                            >
                                                {formName.length}/150
                                            </span>
                                        </div>
                                        {errors.name && (
                                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                                                <AlertCircle className="size-3" />
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Categoría */}
                                    <div className="space-y-1">
                                        <label
                                            htmlFor="category"
                                            className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                                        >
                                            Categoría Auxiliar{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            id="category"
                                            value={formCategoryId}
                                            onChange={(e) =>
                                                setFormCategoryId(
                                                    e.target.value,
                                                )
                                            }
                                            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm dark:bg-neutral-900 ${
                                                errors.category_id
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                                    : 'border-neutral-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-neutral-800'
                                            } text-neutral-950 transition-all focus:ring-2 focus:outline-none dark:text-neutral-50`}
                                        >
                                            <option value="">
                                                Selecciona una categoría
                                            </option>
                                            {categories.map((cat) => (
                                                <option
                                                    key={cat.id}
                                                    value={cat.id}
                                                >
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.category_id && (
                                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                                                <AlertCircle className="size-3" />
                                                {errors.category_id}
                                            </p>
                                        )}
                                    </div>

                                    {/* Estado Activo / Inactivo */}
                                    <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/50">
                                        <div className="space-y-0.5">
                                            <label className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                                                Estado del Producto
                                            </label>
                                            <p className="text-[11px] text-neutral-400">
                                                Determina si el producto está
                                                visible e interactivo.
                                            </p>
                                        </div>
                                        <label className="relative inline-flex cursor-pointer items-center">
                                            <input
                                                type="checkbox"
                                                checked={formStatus}
                                                onChange={(e) =>
                                                    setFormStatus(
                                                        e.target.checked,
                                                    )
                                                }
                                                className="peer sr-only"
                                            />
                                            <div className="peer h-6 w-11 rounded-full bg-neutral-200 peer-checked:bg-indigo-600 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:bg-neutral-800" />
                                            <span className="ml-3 min-w-14 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                                {formStatus
                                                    ? 'Activo'
                                                    : 'Inactivo'}
                                            </span>
                                        </label>
                                    </div>

                                    {/* Descripción (Max 500) */}
                                    <div className="space-y-1">
                                        <label
                                            htmlFor="description"
                                            className="text-xs font-semibold text-neutral-700 dark:text-neutral-300"
                                        >
                                            Descripción del Producto{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <textarea
                                            id="description"
                                            rows={4}
                                            value={formDescription}
                                            onChange={(e) =>
                                                setFormDescription(
                                                    e.target.value,
                                                )
                                            }
                                            maxLength={500}
                                            placeholder="Detalla las especificaciones del producto..."
                                            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm dark:bg-neutral-900 ${
                                                errors.description
                                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                                    : 'border-neutral-200 focus:border-indigo-500 focus:ring-indigo-500/20 dark:border-neutral-800'
                                            } resize-none text-neutral-950 placeholder-neutral-400 transition-all focus:ring-2 focus:outline-none dark:text-neutral-50`}
                                        />
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="text-neutral-400">
                                                Máx. 500 caracteres
                                            </span>
                                            <span
                                                className={
                                                    formDescription.length > 500
                                                        ? 'font-bold text-red-500'
                                                        : 'text-neutral-400'
                                                }
                                            >
                                                {formDescription.length}/500
                                            </span>
                                        </div>
                                        {errors.description && (
                                            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                                                <AlertCircle className="size-3" />
                                                {errors.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Pie de Modal */}
                                <div className="flex justify-end gap-3 border-t border-neutral-200 bg-neutral-50 px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900/50">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading}
                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-[0_2px_4px_rgba(79,70,229,0.2)] transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
                                    >
                                        {actionLoading && (
                                            <Loader2 className="size-3 animate-spin" />
                                        )}
                                        <span>Guardar Producto</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  Upload,
  Image,
  Search,
  UtensilsCrossed,
} from 'lucide-react';
import api from '../lib/api';
import { formatLempiras } from '../lib/utils';
import type { Product, Category } from '../types';
import toast from 'react-hot-toast';

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showMenuRef, setShowMenuRef] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    isAvailable: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory = !selectedCategory || p.categoryId === selectedCategory;
    const matchesSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openForm = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        categoryId: product.categoryId.toString(),
        isAvailable: product.isAvailable,
      });
      setImagePreview(product.imageUrl || '');
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        categoryId: categories[0]?.id.toString() || '',
        isAvailable: true,
      });
      setImagePreview('');
    }
    setImageFile(null);
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('categoryId', formData.categoryId);
      data.append('isAvailable', formData.isAvailable.toString());
      if (imageFile) {
        data.append('image', imageFile);
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Producto actualizado');
      } else {
        await api.post('/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Producto creado');
      }

      setShowForm(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (product: Product) => {
    try {
      await api.patch(`/products/${product.id}/toggle`);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p
        )
      );
      toast.success(
        `${product.name} ${!product.isAvailable ? 'disponible' : 'no disponible'}`
      );
    } catch {
      toast.error('Error al cambiar disponibilidad');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success('Producto eliminado');
    } catch {
      toast.error('Error al eliminar. Puede tener órdenes asociadas.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-cafe-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 pb-20 md:pb-6">
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-cafe-700 dark:text-white">
              Gestión de Menú
            </h1>
            <p className="text-cafe-400 text-xs sm:text-sm mt-1">
              {products.length} productos en total
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowMenuRef(!showMenuRef)}
              className="btn-outline text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
            >
              <Image size={16} />
              Menú Ref.
            </button>
            <button
              onClick={() => openForm()}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={18} />
              Nuevo Producto
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-cafe-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
              className="input-field w-full sm:w-48 text-sm"
          >
            <option value="">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Products Table - Desktop */}
        <div className="hidden sm:block card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-zebra">
              <thead>
                <tr className="bg-cream-200 dark:bg-gray-700">
                  <th className="text-left p-2 sm:p-3 text-xs font-semibold text-cafe-600 dark:text-cream-300">
                    Producto
                  </th>
                  <th className="text-left p-2 sm:p-3 text-xs font-semibold text-cafe-600 dark:text-cream-300 hidden md:table-cell">
                    Categoría
                  </th>
                  <th className="text-left p-2 sm:p-3 text-xs font-semibold text-cafe-600 dark:text-cream-300">
                    Precio
                  </th>
                  <th className="text-center p-2 sm:p-3 text-xs font-semibold text-cafe-600 dark:text-cream-300">
                    Estado
                  </th>
                  <th className="text-center p-2 sm:p-3 text-xs font-semibold text-cafe-600 dark:text-cream-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="border-b border-cream-100 dark:border-gray-700">
                    <td className="p-2 sm:p-3">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden bg-cream-200 flex-shrink-0">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-cafe-300">
                              <UtensilsCrossed size={16} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-cafe-700 dark:text-white">
                            {product.name}
                          </p>
                          <p className="text-xs text-cafe-400 line-clamp-1 md:hidden">
                            {product.category?.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 sm:p-3 hidden md:table-cell">
                      <span className="text-xs bg-cream-200 dark:bg-gray-600 text-cafe-600 dark:text-cream-300 px-2 py-1 rounded-full">
                        {product.category?.name}
                      </span>
                    </td>
                    <td className="p-2 sm:p-3">
                      <span className="text-xs sm:text-sm font-bold text-gold-400 whitespace-nowrap">
                        {formatLempiras(product.price)}
                      </span>
                    </td>
                    <td className="p-2 sm:p-3 text-center">
                      <button
                        onClick={() => handleToggle(product)}
                        className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-1 rounded-full min-h-[44px] cursor-pointer select-none ${
                          product.isAvailable
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {product.isAvailable ? (
                          <><ToggleRight size={14} /> Disponible</>
                        ) : (
                          <><ToggleLeft size={14} /> No Disp.</>
                        )}
                      </button>
                    </td>
                    <td className="p-2 sm:p-3">
                      <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                        <button
                          onClick={() => openForm(product)}
                          className="p-2 rounded-lg hover:bg-cream-200 dark:hover:bg-gray-700 text-cafe-500 hover:text-cafe-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-cafe-300">
              <UtensilsCrossed size={40} className="mx-auto mb-2 opacity-50" />
              <p>No se encontraron productos</p>
            </div>
          )}
        </div>

        {/* Products Cards - Mobile */}
        <div className="sm:hidden space-y-3">
          {filteredProducts.map((product) => (
            <div key={product.id} className="card p-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-cream-200 flex-shrink-0">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-cafe-300">
                      <UtensilsCrossed size={20} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-cafe-700 dark:text-white truncate">{product.name}</p>
                  <p className="text-xs text-cafe-400">{product.category?.name}</p>
                  <p className="text-sm font-bold text-gold-400 whitespace-nowrap">{formatLempiras(product.price)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(product)}
                  className={`flex-1 inline-flex items-center justify-center gap-1 text-xs font-medium px-2 py-2 rounded-lg min-h-[44px] cursor-pointer select-none ${
                    product.isAvailable
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {product.isAvailable ? (
                    <><ToggleRight size={14} /> Disponible</>
                  ) : (
                    <><ToggleLeft size={14} /> No Disp.</>
                  )}
                </button>
                <button
                  onClick={() => openForm(product)}
                  className="p-2 rounded-lg bg-cream-200 dark:bg-gray-700 text-cafe-500 hover:text-cafe-700 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(product)}
                  className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-400 hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer select-none"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="text-center py-12 text-cafe-300">
              <UtensilsCrossed size={40} className="mx-auto mb-2 opacity-50" />
              <p>No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu Reference Panel */}
      <AnimatePresence>
        {showMenuRef && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="w-full lg:w-80 card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-cafe-700 dark:text-white text-sm">
                Menú de Referencia
              </h3>
              <button
                onClick={() => setShowMenuRef(false)}
                className="text-cafe-400 hover:text-cafe-700"
              >
                <X size={18} />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-cream-200">
              <img
                src="/assets/images/Menu.png"
                alt="Menú de referencia"
                className="w-full h-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '';
                  (e.target as HTMLImageElement).alt = 'Imagen no disponible';
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90dvh] overflow-y-auto p-4 sm:p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-display font-bold text-cafe-700 dark:text-white">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h2>
                <button onClick={() => setShowForm(false)} className="text-cafe-400 hover:text-cafe-700">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image */}
                <div>
                  <label className="text-sm font-medium text-cafe-700 dark:text-white mb-2 block">
                    Imagen
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-xl bg-cream-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Upload size={24} className="text-cafe-300" />
                      )}
                    </div>
                    <label className="btn-outline text-sm cursor-pointer flex items-center gap-2">
                      <Upload size={16} />
                      Subir Imagen
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-sm font-medium text-cafe-700 dark:text-white mb-2 block">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-sm font-medium text-cafe-700 dark:text-white mb-2 block">
                    Descripción
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field resize-none"
                    rows={2}
                  />
                </div>

                {/* Price & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-cafe-700 dark:text-white mb-2 block">
                      Precio (L.) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="input-field"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-cafe-700 dark:text-white mb-2 block">
                      Categoría *
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="input-field"
                      required
                    >
                      <option value="">Seleccionar</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Availability */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      formData.isAvailable ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        formData.isAvailable ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-cafe-600 dark:text-cream-300">
                    {formData.isAvailable ? 'Disponible' : 'No Disponible'}
                  </span>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-outline flex-1"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save size={18} />
                        {editingProduct ? 'Actualizar' : 'Crear'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

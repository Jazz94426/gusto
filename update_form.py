import re

with open("src/components/import/ManualEntryForm.tsx", "r") as f:
    content = f.read()

# Add imports
content = content.replace('import { Select } from "@/components/ui/Select";', 'import { Select } from "@/components/ui/Select";\nimport { PREDEFINED_UTENSILS } from "@/constants/utensils";\nimport { Check } from "lucide-react";')

# Add state
state_code = """
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [utensils, setUtensils] = useState<string[]>(initialData?.utensils || []);
  const [showUtensilsModal, setShowUtensilsModal] = useState(false);
"""
content = re.sub(r'  const \[tags, setTags\] = useState<string\[\]>\(initialData\?.tags \|\| \[\]\);\n  const \[tagInput, setTagInput\] = useState\(""\);\n  const \[notes, setNotes\] = useState\(initialData\?.notes \|\| ""\);', state_code, content)

# Update useEffect dependencies
content = content.replace(
    '  }, [title, description, ingredients, instructions, prepTime, cookTime, servings, difficulty, tags, notes]);',
    '  }, [title, description, ingredients, instructions, prepTime, cookTime, servings, difficulty, tags, notes, utensils]);'
)

# Update autosave payload
content = content.replace(
    'prepTime, cookTime, servings, difficulty, tags, notes,',
    'prepTime, cookTime, servings, difficulty, tags, notes, utensils,'
)

content = content.replace(
    '  }, [title, description, ingredients, instructions, prepTime, cookTime, servings, difficulty, tags, notes, user, isSandbox, initialData]);',
    '  }, [title, description, ingredients, instructions, prepTime, cookTime, servings, difficulty, tags, notes, utensils, user, isSandbox, initialData]);'
)

# Update handleSave payload
content = content.replace(
    '        tags,\n        notes,',
    '        tags,\n        notes,\n        utensils,'
)

# Replace JSX return
jsx = """  return (
    <div className="relative">
      <div className="grid md:grid-cols-12 gap-8 lg:gap-16">
        {/* Left Column */}
        <div className="md:col-span-7 lg:col-span-8 space-y-8">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">{t('recipe.title')}</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Tarte aux pommes"
              className="text-2xl font-heading font-black py-6"
              required
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b border-stone-light/30 pb-6">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">{t('recipe.prep_time')} (min)</label>
              <Input type="number" value={prepTime} onChange={(e) => setPrepTime(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">{t('recipe.cook_time')} (min)</label>
              <Input type="number" value={cookTime} onChange={(e) => setCookTime(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">{t('recipe.servings')}</label>
              <Input type="number" value={servings} onChange={(e) => setServings(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1">{t('recipe.difficulty')}</label>
              <Select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")}
                options={[
                  { value: "easy", label: t('recipe.difficulty_easy') },
                  { value: "medium", label: t('recipe.difficulty_medium') },
                  { value: "hard", label: t('recipe.difficulty_hard') },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">{t('recipe.description')}</label>
            <textarea
              className="w-full rounded-xl border border-stone p-3 focus:outline-none focus:ring-2 focus:ring-terracotta text-brown"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Une délicieuse tarte..."
            />
          </div>

          {/* Utensils Section */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-heading text-charcoal font-black">Ustensiles</h3>
              <Button variant="secondary" size="sm" onClick={() => setShowUtensilsModal(true)}>+ Ajouter un ustensile</Button>
            </div>
            {utensils.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {utensils.map(uId => {
                  const u = PREDEFINED_UTENSILS.find(x => x.id === uId);
                  if (!u) return null;
                  return (
                    <div key={u.id} className="border border-stone/30 bg-cream/50 rounded-xl p-3 flex flex-col items-center text-center relative">
                      <button 
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200"
                        onClick={() => setUtensils(utensils.filter(id => id !== u.id))}
                      >
                        ×
                      </button>
                      {u.image && <img src={u.image} alt={u.name} className="w-16 h-16 object-cover rounded mb-2 mix-blend-multiply" />}
                      <span className="text-sm font-medium text-charcoal">{u.name}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-stone text-sm">Aucun ustensile sélectionné.</p>
            )}
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-3xl font-heading text-charcoal font-black mb-6">{t('recipe.instructions')}</h3>
            <div className="space-y-4">
              {instructions.map((inst, idx) => (
                <div key={idx} className="flex space-x-4 items-start">
                  <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-cream-dark text-charcoal flex items-center justify-center font-heading font-black mt-1">
                    {idx + 1}
                  </div>
                  <textarea
                    className="flex-1 rounded-xl border border-stone p-3 focus:outline-none focus:ring-2 focus:ring-terracotta text-charcoal"
                    rows={2}
                    value={inst}
                    onChange={(e) => handleUpdateInstruction(idx, e.target.value)}
                    placeholder="Étape de préparation..."
                  />
                  <div className="flex flex-col space-y-1">
                    <Button variant="ghost" size="sm" onClick={() => handleMoveInstruction(idx, "up")} disabled={idx === 0}>↑</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleMoveInstruction(idx, "down")} disabled={idx === instructions.length - 1}>↓</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveInstruction(idx)} className="text-red-500">X</Button>
                  </div>
                </div>
              ))}
              <Button variant="secondary" size="sm" onClick={handleAddInstruction} className="mt-4">+ Ajouter une étape</Button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-5 lg:col-span-4 space-y-8">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Image de couverture</label>
            <div className="bg-cream rounded-xl p-4 border border-stone/30">
              <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-charcoal mb-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-terracotta/10 file:text-terracotta hover:file:bg-terracotta/20" />
              {coverImagePreview && (
                <img src={coverImagePreview} alt="Preview" className="w-full aspect-square object-cover rounded-xl mt-4" />
              )}
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-[#F8F5F2] p-6 rounded-2xl">
            <h3 className="text-2xl font-heading text-charcoal font-black mb-6">{t('recipe.ingredients')}</h3>
            <div className="space-y-3">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-stone/20">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      className="w-20"
                      value={ing.quantity || ""}
                      onChange={(e) => handleUpdateIngredient(idx, "quantity", e.target.value ? Number(e.target.value) : null)}
                      placeholder="Qté"
                    />
                    <Select
                      className="w-24"
                      value={ing.unit}
                      onChange={(e) => handleUpdateIngredient(idx, "unit", e.target.value)}
                      options={[
                        { value: "g", label: "g" },
                        { value: "kg", label: "kg" },
                        { value: "mL", label: "mL" },
                        { value: "L", label: "L" },
                        { value: "pièce", label: "pièce" },
                        { value: "c.à.s", label: "c.à.s" },
                        { value: "c.à.c", label: "c.à.c" },
                        { value: "tasse", label: "tasse" },
                        { value: "pincée", label: "pincée" },
                      ]}
                    />
                    <Button variant="ghost" onClick={() => handleRemoveIngredient(idx)} className="text-red-500 px-2">X</Button>
                  </div>
                  <Input
                    className="w-full"
                    value={ing.name}
                    onChange={(e) => handleUpdateIngredient(idx, "name", e.target.value)}
                    placeholder="Nom de l'ingrédient"
                  />
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={handleAddIngredient} className="w-full mt-2 text-terracotta border border-terracotta/30">+ Ajouter un ingrédient</Button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">{t('recipe.tags')}</label>
            <div className="flex space-x-2 mb-3">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Ajouter un tag"
              />
              <Button variant="secondary" onClick={handleAddTag}>{t('common.add')}</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-cream text-terracotta border border-terracotta/30">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 text-terracotta hover:text-terracotta-dark">×</button>
                </span>
              ))}
            </div>
          </div>
          
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Notes (Optionnel)</label>
            <textarea
              className="w-full rounded-xl border border-stone p-3 focus:outline-none focus:ring-2 focus:ring-terracotta bg-[#F8F5F2]"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Astuces, substitutions..."
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-12 flex items-center justify-end space-x-4 pt-6 border-t border-stone">
        {extraActions}
        <Button onClick={handleSave} isLoading={loading} className="bg-terracotta text-white hover:bg-terracotta-dark">
          {submitLabel || "Sauvegarder la recette"}
        </Button>
      </div>

      {/* Utensil Modal */}
      {showUtensilsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-charcoal/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-stone/20 flex justify-between items-center">
              <h2 className="text-2xl font-heading text-charcoal font-black">Sélectionner des ustensiles</h2>
              <button onClick={() => setShowUtensilsModal(false)} className="text-stone hover:text-charcoal text-xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {PREDEFINED_UTENSILS.map(u => {
                const isSelected = utensils.includes(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      if (isSelected) {
                        setUtensils(utensils.filter(id => id !== u.id));
                      } else {
                        setUtensils([...utensils, u.id]);
                      }
                    }}
                    className={`relative p-3 rounded-xl border flex flex-col items-center text-center transition-all ${isSelected ? 'border-terracotta bg-cream shadow-sm ring-1 ring-terracotta' : 'border-stone/30 hover:border-stone/60'}`}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 bg-terracotta text-white rounded-full p-1 shadow">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    {u.image && <img src={u.image} alt={u.name} className="w-16 h-16 object-cover rounded mb-2 mix-blend-multiply" />}
                    <span className={`text-sm font-medium ${isSelected ? 'text-terracotta' : 'text-charcoal'}`}>{u.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="p-6 border-t border-stone/20 flex justify-end">
              <Button onClick={() => setShowUtensilsModal(false)}>Valider</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}"""

content = re.sub(r'  return \(\n    <div className="space-y-6">.*', jsx, content, flags=re.DOTALL)

with open("src/components/import/ManualEntryForm.tsx", "w") as f:
    f.write(content)

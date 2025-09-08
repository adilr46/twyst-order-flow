-- Update menu item descriptions with AI-generated crisp descriptions

-- Appetizers
UPDATE menu_items SET description = 'Crusty artisan bread brushed with garlic butter and fresh herbs. Golden and aromatic.' WHERE name = 'Garlic Bread';
UPDATE menu_items SET description = 'Toasted ciabatta topped with vine-ripened tomatoes, fresh basil, and extra virgin olive oil.' WHERE name = 'Bruschetta';
UPDATE menu_items SET description = 'Chef''s seasonal creation using the freshest local ingredients. Ask your server for today''s special.' WHERE name = 'Soup of the Day';
UPDATE menu_items SET description = 'Tender squid rings in crispy beer batter, served with zesty lemon aioli. Perfectly golden.' WHERE name = 'Calamari';
UPDATE menu_items SET description = 'Fresh mozzarella di bufala with heirloom tomatoes and basil. Drizzled with aged balsamic.' WHERE name = 'Caprese Salad';

-- Mains
UPDATE menu_items SET description = 'Juicy chicken breast with crisp lettuce, tomato, and house-made mayo on artisan bread.' WHERE name = 'Grilled Chicken Sandwich';
UPDATE menu_items SET description = 'Premium Angus beef patty with aged cheddar, crispy bacon, and our signature sauce.' WHERE name = 'Beef Burger';
UPDATE menu_items SET description = 'Crisp romaine hearts with parmesan shavings, house-made croutons, and classic caesar dressing.' WHERE name = 'Caesar Salad';
UPDATE menu_items SET description = 'Al dente spaghetti with creamy egg sauce, pancetta, and aged pecorino. Authentically Roman.' WHERE name = 'Pasta Carbonara';
UPDATE menu_items SET description = 'Beer-battered cod with twice-cooked chips and mushy peas. A British classic done right.' WHERE name = 'Fish & Chips';

-- Desserts
UPDATE menu_items SET description = 'Decadent triple-layer chocolate cake with rich ganache frosting. Pure indulgence.' WHERE name = 'Chocolate Cake';
UPDATE menu_items SET description = 'Classic Italian dessert with espresso-soaked ladyfingers and mascarpone cream. Coffee lover''s dream.' WHERE name = 'Tiramisu';
UPDATE menu_items SET description = 'Warm spiced apple pie with flaky pastry crust. Served with vanilla bean ice cream.' WHERE name = 'Apple Pie';
UPDATE menu_items SET description = 'New York-style cheesecake with graham cracker crust. Topped with mixed berry compote.' WHERE name = 'Cheesecake';
UPDATE menu_items SET description = 'Three scoops of premium ice cream with hot fudge, whipped cream, and rainbow sprinkles.' WHERE name = 'Ice Cream Sundae';

-- Drinks
UPDATE menu_items SET description = 'Rich espresso with perfectly steamed milk and velvety foam. Italian coffee artistry.' WHERE name = 'Cappuccino';
UPDATE menu_items SET description = 'Smooth espresso with silky steamed milk. Customize with your favorite syrup.' WHERE name = 'Latte';
UPDATE menu_items SET description = 'Bold espresso diluted with hot water. Clean, strong, and satisfying.' WHERE name = 'Americano';
UPDATE menu_items SET description = 'Rich Belgian chocolate with steamed milk and whipped cream. Winter comfort in a cup.' WHERE name = 'Hot Chocolate';
UPDATE menu_items SET description = 'Freshly squeezed Valencia oranges. Vitamin C boost with natural sweetness.' WHERE name = 'Fresh Orange Juice';

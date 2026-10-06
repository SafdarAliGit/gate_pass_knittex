# Copyright (c) 2024, Tech Ventures and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt

class GateOutwardPass(Document):
	def validate(self):
		self.total_qty = sum(flt(row.qty) for row in self.get("sample_form_items"))

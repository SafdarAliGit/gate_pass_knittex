# Copyright (c) 2024, Tech Ventures and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt

class GateOutwardPass(Document):
	def validate(self):
		self.total_qty = sum(flt(row.qty) for row in self.get("sample_form_items"))

	def on_submit(self):
		for row in self.get("sample_form_items"):
			if row.sample_form:
				sf = frappe.get_doc("Sample Forms", row.sample_form)
				if sf:
					sf.gate_outward_pass = self.name
					sf.gate_outward_pass_date = self.date
					sf.save()

	def on_cancel(self):
		for row in self.get("sample_form_items"):
			if row.sample_form:
				sf = frappe.get_doc("Sample Forms", row.sample_form)
				if sf:
					sf.gate_outward_pass = None
					sf.gate_outward_pass_date = None
					sf.save()

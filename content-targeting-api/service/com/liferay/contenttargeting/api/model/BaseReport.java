/**
 * Copyright (c) 2000-present Liferay, Inc. All rights reserved.
 *
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 *
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 */

package com.liferay.contenttargeting.api.model;

import com.liferay.portal.kernel.io.unsync.UnsyncStringWriter;
import com.liferay.portal.kernel.log.Log;
import com.liferay.portal.kernel.log.LogFactoryUtil;
import com.liferay.portal.kernel.util.StringPool;
import com.liferay.portal.security.permission.ResourceActionsUtil;

import freemarker.cache.ClassTemplateLoader;

import freemarker.template.Configuration;
import freemarker.template.DefaultObjectWrapper;
import freemarker.template.Template;

import java.util.Locale;
import java.util.Map;

import org.osgi.service.component.annotations.Activate;
import org.osgi.service.component.annotations.Deactivate;

/**
 * @author Eduardo Garcia
 */
public abstract class BaseReport implements Report {

	@Activate
	public void activate() {
		if (_log.isDebugEnabled()) {
			_log.debug("Report activate: " + getClass().getSimpleName());
		}
	}

	@Deactivate
	public void deActivate() {
		if (_log.isDebugEnabled()) {
			_log.debug("Report deactivate: " + getClass().getSimpleName());
		}
	}

	@Override
	public String getDescription(Locale locale) {
		String key = getClass().getName().concat(".description");

		String description = ResourceActionsUtil.getModelResource(locale, key);

		if (description.equals(key)) {
			description = StringPool.BLANK;
		}

		return description;
	}

	@Override
	public String getHTML(Map<String, Object> context) {
		String content = StringPool.BLANK;

		try {
			populateContext(context);

			content = parseTemplate(getClass(), _FORM_TEMPLATE_PATH, context);
		}
		catch (Exception e) {
			_log.error(
				"Error while processing report form template " +
					_FORM_TEMPLATE_PATH,
				e);
		}

		return content;
	}

	@Override
	public String getIcon() {
		return "icon-file";
	}

	@Override
	public String getName(Locale locale) {
		return ResourceActionsUtil.getModelResource(
			locale, getClass().getName());
	}

	@Override
	public String getReportKey() {
		return getClass().getSimpleName();
	}

	protected String parseTemplate(
			Class clazz, String templatePath, Map<String, Object> context)
		throws Exception {

		Configuration configuration = new Configuration();

		configuration.setObjectWrapper(new DefaultObjectWrapper());
		configuration.setTemplateLoader(
			new ClassTemplateLoader(clazz, StringPool.SLASH));
		configuration.setTemplateUpdateDelay(Integer.MAX_VALUE);

		Template template = configuration.getTemplate(templatePath);

		UnsyncStringWriter unsyncStringWriter = new UnsyncStringWriter();

		template.process(context, unsyncStringWriter);

		return unsyncStringWriter.toString();
	}

	protected void populateContext(Map<String, Object> context) {
	}

	protected static final String _FORM_TEMPLATE_PATH =
		"templates/ct_report.ftl";

	private static Log _log = LogFactoryUtil.getLog(BaseReport.class);

}